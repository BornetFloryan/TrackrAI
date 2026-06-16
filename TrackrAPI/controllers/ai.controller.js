const Session = require('../models/session.model')
const { answer } = require('./ControllerAnswer')
const aiService = require('../services/ai.service')

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

const trainModel = async (req, res) => {
  answer.reset()
  try {
    answer.setPayload(aiService.trainModel())
    return res.status(200).send(answer)
  } catch (error) {
    answer.set({ error: 700, status: 500, data: error.message })
    return res.status(500).send(answer)
  }
}

const predictForSession = async (req, res) => {
  answer.reset()
  const { sessionId } = req.params
  const s = await Session.findOne({ sessionId }).lean().exec()
  if (!s) {
    answer.set({ error: 404, status: 404, data: 'session not found' })
    return res.status(404).send(answer)
  }

  if (!(await canAccessSession(req.user, s))) {
    answer.set({ error: 703, status: 403, data: 'session access denied' })
    return res.status(403).send(answer)
  }

  try {
    const result = aiService.predictSession(sessionId)
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
  const stress = Number.isFinite(stats.stress) ? stats.stress : null
  const rmssd = Number.isFinite(stats.rmssd) ? stats.rmssd : null
  const advice = []

  if (stress == null) advice.push('Collecter la fréquence cardiaque et la HRV pour estimer la fatigue.')
  else if (stress >= 70) advice.push('Prévoir une séance légère ou une récupération avant un nouvel effort intense.')
  else if (stress >= 45) advice.push('Charge modérée : surveiller la récupération avant la prochaine séance.')
  else advice.push('Les indicateurs de récupération sont favorables.')

  if (stats.score?.components?.load < 35) advice.push('Augmenter progressivement la durée ou la distance.')
  if (stats.score?.components?.intensity > 80) advice.push('L’intensité cardiaque est élevée : privilégier une récupération active.')

  answer.setPayload({
    sessionId: session.sessionId,
    performance: stats.score || null,
    fatigue: {
      score: stress,
      level: stress == null ? 'unknown' : stress >= 70 ? 'high' : stress >= 45 ? 'moderate' : 'low',
    },
    hrv: {
      rmssd,
      status: rmssd == null ? 'unknown' : rmssd < 25 ? 'low' : rmssd < 45 ? 'normal' : 'high',
    },
    advice,
  })
  return res.status(200).send(answer)
}

module.exports = { trainModel, predictForSession, getSessionInsights }
