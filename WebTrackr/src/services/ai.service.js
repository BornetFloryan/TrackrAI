import api from './api'

export async function trainModel() {
  return api.post('/train')
}

export async function predictSession(sessionId) {
  return api.get(`/predict/${sessionId}`)
}
