const Session = require('../models/session.model')
const { answer } = require('./ControllerAnswer')
const aiService = require('../services/ai.service')

function num(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function round(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round(num(value) * factor) / factor
}

async function canAccessSession(user, session) {
  if (!user) return false
  if (user.rights.includes('admin')) return true
  if (user.rights.includes('coach')) {
    const User = require('../models/user.model')
    const athlete = await User.findOne({ _id: session.user, coach: user._id }, '_id').lean().exec()
    return !!athlete
  }
  return String(session.user) === String(user._id)
}

function buildTrainingRecommendation(session, prediction) {
  const stats = session.stats || {}
  const currentHr = Number.isFinite(stats.hrAvg) ? stats.hrAvg : null
  const predictedHr = prediction?.predictedNextHrAvg
  const deltaBpm = prediction?.deltaBpm
  const metrics = prediction?.model?.metrics || {}
  const validated = metrics.beatsBaseline === true
  const stress = Number.isFinite(stats.stress) ? stats.stress : null
  const recovery = Number.isFinite(stats.score?.components?.recovery)
    ? stats.score.components.recovery
    : null
  const distanceKm = num(stats.distanceKm)
  const durationMin = num(stats.durationMs) / 60000
  const steps = num(stats.steps)

  const reasons = []
  const warnings = []
  let decision = 'maintain'
  let label = 'Maintenir une charge comparable'
  let intensityTarget = 'modérée'
  let loadFactor = 1

  reasons.push(`FC moyenne actuelle : ${round(currentHr)} bpm.`)
  reasons.push(`FC moyenne prévue à charge comparable : ${round(predictedHr)} bpm.`)
  if (Number.isFinite(deltaBpm)) {
    reasons.push(`Écart prévu par rapport à la séance actuelle : ${deltaBpm > 0 ? '+' : ''}${round(deltaBpm)} bpm.`)
  }
  if (Number.isFinite(metrics.maeBpm)) {
    reasons.push(`Erreur absolue moyenne mesurée en validation : ${round(metrics.maeBpm)} bpm.`)
  }

  if (!validated) {
    warnings.push("Le modèle ne bat pas encore la baseline simple sur le jeu de validation : la prévision reste informative et ne pilote pas une hausse de charge.")
  } else if ((stress != null && stress >= 70) || (recovery != null && recovery < 35) || deltaBpm >= 8) {
    decision = 'recover'
    label = 'Réduire la charge ou récupérer'
    intensityTarget = 'faible'
    loadFactor = 0.8
    reasons.push('La réponse cardiaque prévue ou les indicateurs de récupération appellent à la prudence.')
  } else if (deltaBpm <= 3 && (stress == null || stress < 50) && (recovery == null || recovery >= 45)) {
    decision = 'progress'
    label = 'Progression légère envisageable'
    intensityTarget = 'modérée'
    loadFactor = 1.05
    reasons.push('À charge comparable, la réponse cardiaque prévue reste stable et les indicateurs de récupération sont favorables.')
  } else {
    reasons.push('La prévision ne justifie pas une augmentation nette de la charge.')
  }

  return {
    decision,
    label,
    validated,
    summary: `${label} pour la prochaine séance, avec une intensité ${intensityTarget}.`,
    nextSession: {
      intensity: intensityTarget,
      distanceKm: distanceKm >= 0.1 ? round(distanceKm * loadFactor, 2) : null,
      durationMin: durationMin >= 5 ? Math.round(durationMin * loadFactor) : null,
      steps: steps >= 100 ? Math.round(steps * loadFactor) : null,
      focus: decision === 'recover'
        ? 'récupération active et contrôle de la réponse cardiaque'
        : decision === 'progress'
          ? 'progression très légère avec charge comparable'
          : 'reproduire une charge comparable pour confirmer la tendance',
    },
    reasons,
    warnings,
  }
}

function storedPrediction(result) {
  return {
    predictedHrAvg: result.predictedNextHrAvg,
    deltaBpm: result.deltaBpm,
    expectedRange: result.expectedRange,
    target: result.target,
    model: 'XGBoost',
    predictedAt: new Date(),
  }
}

const trainModel = async (req, res) => {
  answer.reset()
  try {
    const training = aiService.trainModel()
    let appliedPredictions = 0

    if (training.ok) {
      const sessions = await Session.find({ endDate: { $exists: true } }).exec()
      for (const session of sessions) {
        const prediction = aiService.predictSession(session.sessionId)
        if (!prediction.ok || !Number.isFinite(prediction.predictedNextHrAvg)) {
          if (session.stats?.aiPrediction) {
            delete session.stats.aiPrediction
            session.markModified('stats')
            await session.save()
          }
          continue
        }
        session.stats.aiPrediction = storedPrediction(prediction)
        session.stats.aiExplain = prediction.explain
        session.stats.aiModel = prediction.model
        session.markModified('stats')
        await session.save()
        appliedPredictions += 1
      }
    }

    answer.setPayload({ ...training, appliedPredictions })
    return res.status(200).send(answer)
  } catch (error) {
    answer.set({ error: 700, status: 500, data: error.message })
    return res.status(500).send(answer)
  }
}

const predictForSession = async (req, res) => {
  answer.reset()
  const session = await Session.findOne({ sessionId: req.params.sessionId }).lean().exec()
  if (!session) {
    answer.set({ error: 404, status: 404, data: 'session not found' })
    return res.status(404).send(answer)
  }
  if (!(await canAccessSession(req.user, session))) {
    answer.set({ error: 703, status: 403, data: 'session access denied' })
    return res.status(403).send(answer)
  }

  try {
    const result = aiService.predictSession(session.sessionId)
    if (!result.ok) {
      answer.set({ error: 701, status: 409, data: result })
      return res.status(409).send(answer)
    }
    answer.setPayload(result)
    return res.status(200).send(answer)
  } catch (error) {
    answer.set({ error: 702, status: 500, data: error.message })
    return res.status(500).send(answer)
  }
}

const getSessionInsights = async (req, res) => {
  answer.reset()
  const session = await Session.findOne({ sessionId: req.params.sessionId }).lean().exec()
  if (!session) {
    answer.set({ error: 404, status: 404, data: 'session not found' })
    return res.status(404).send(answer)
  }
  if (!(await canAccessSession(req.user, session))) {
    answer.set({ error: 703, status: 403, data: 'session access denied' })
    return res.status(403).send(answer)
  }

  const stats = session.stats || {}
  let prediction = null
  let unavailable = null

  if (
    stats.aiPrediction?.target === 'next_comparable_session_hr_avg'
    && Number.isFinite(stats.aiPrediction?.predictedHrAvg)
  ) {
    prediction = {
      ok: true,
      predictedNextHrAvg: stats.aiPrediction.predictedHrAvg,
      currentHrAvg: stats.hrAvg,
      deltaBpm: stats.aiPrediction.deltaBpm,
      expectedRange: stats.aiPrediction.expectedRange || null,
      target: stats.aiPrediction.target,
      unit: 'bpm',
      model: stats.aiModel || null,
      evaluation: stats.aiPrediction.evaluation || null,
    }
  } else {
    try {
      const result = aiService.predictSession(session.sessionId)
      if (result?.ok) {
        prediction = result
        await Session.updateOne(
          { _id: session._id },
          {
            $set: {
              'stats.aiPrediction': storedPrediction(result),
              'stats.aiExplain': result.explain,
              'stats.aiModel': result.model,
            },
          }
        ).exec()
      } else unavailable = result
    } catch (error) {
      unavailable = { reason: 'prediction_failed' }
    }
  }

  const recommendation = prediction ? buildTrainingRecommendation(session, prediction) : null
  answer.setPayload({
    sessionId: session.sessionId,
    purpose: "Prévoir la fréquence cardiaque moyenne de la prochaine séance comparable et vérifier ensuite l'erreur sur la valeur réellement mesurée.",
    prediction: prediction
      ? {
        predictedNextHrAvg: prediction.predictedNextHrAvg,
        currentHrAvg: prediction.currentHrAvg,
        deltaBpm: prediction.deltaBpm,
        expectedRange: prediction.expectedRange,
        target: prediction.target,
        unit: prediction.unit,
        model: prediction.model,
        evaluation: prediction.evaluation || stats.aiPrediction?.evaluation || null,
      }
      : null,
    availability: prediction
      ? { eligible: true }
      : {
        eligible: false,
        reason: unavailable?.reason || 'prediction_not_available',
        qualityReasons: unavailable?.qualityReasons || [],
        minimums: unavailable?.minimums || null,
      },
    recommendation,
  })
  return res.status(200).send(answer)
}

module.exports = { trainModel, predictForSession, getSessionInsights }
