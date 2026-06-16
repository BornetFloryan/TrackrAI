const path = require('path')
const { spawnSync } = require('child_process')

const AI_DIR = path.join(__dirname, '..', 'ai')
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3'
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 120000)

function runJsonScript(scriptName, args = []) {
  const script = path.join(AI_DIR, scriptName)
  const out = spawnSync(PYTHON_EXECUTABLE, [script, ...args], {
    encoding: 'utf-8',
    env: process.env,
    timeout: AI_TIMEOUT_MS,
  })

  if (out.error) {
    throw new Error(`${scriptName}: ${out.error.message}`)
  }

  if (out.status !== 0) {
    throw new Error(`${scriptName}: ${(out.stderr || out.stdout || 'execution failed').trim()}`)
  }

  const stdout = (out.stdout || '').trim()
  if (!stdout) {
    throw new Error(`${scriptName}: empty output`)
  }

  try {
    return JSON.parse(stdout)
  } catch {
    throw new Error(`${scriptName}: invalid JSON output: ${stdout}`)
  }
}

function trainModel() {
  return runJsonScript('train_model.py')
}

function predictSession(sessionId) {
  return runJsonScript('predict_session.py', [String(sessionId)])
}

module.exports = { AI_DIR, PYTHON_EXECUTABLE, trainModel, predictSession }
