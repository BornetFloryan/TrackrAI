import api from './api.service'

export async function trainModel() {
  return api.post('/ai/train')
}

export async function predictSession(sessionId) {
  return api.get(`/ai/predict/${sessionId}`)
}

export async function getSessionInsights(sessionId) {
  return api.get(`/ai/insights/${sessionId}`)
}
