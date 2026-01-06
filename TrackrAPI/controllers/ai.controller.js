const path = require('path')
const { spawnSync } = require('child_process')
const Session = require('../models/session.model')
const { answer } = require('./ControllerAnswer')

const trainModel = async (req, res) => {
  answer.reset()
  const script = path.join(__dirname, '..', 'python', 'train_model.py')
  const out = spawnSync('python3', [script], { encoding: 'utf-8', env: process.env })

  if (out.status !== 0) {
    answer.set({ error: 500, status: 500, data: out.stderr || 'TRAIN FAILED' })
    return res.status(500).send(answer)
  }

  let payload = out.stdout
  try { payload = JSON.parse(out.stdout) } catch {}
  answer.setPayload(payload)
  return res.status(200).send(answer)
}

const predictForSession = async (req, res) => {
  answer.reset()
  const { sessionId } = req.params
  const s = await Session.findOne({ sessionId }).lean().exec()
  if (!s) {
    answer.set({ error: 404, status: 404, data: 'session not found' })
    return res.status(404).send(answer)
  }

  const script = path.join(__dirname, '..', 'python', 'predict_session.py')
  const out = spawnSync('python3', [script, String(sessionId)], { encoding: 'utf-8', env: process.env })

  if (out.status !== 0) {
    answer.set({ error: 500, status: 500, data: out.stderr || 'PREDICT FAILED' })
    return res.status(500).send(answer)
  }

  const result = JSON.parse(out.stdout)

  answer.setPayload(result)
  return res.status(200).send(answer)
}

module.exports = { trainModel, predictForSession }
