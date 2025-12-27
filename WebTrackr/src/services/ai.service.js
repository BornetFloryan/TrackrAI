export default {
  async analyzeSession(sessionId) {
    // plus tard :
    // return api.post('/ai/analyze', { sessionId })
    return {
      fatigue: null,
      advice: 'Analyse bientôt disponible'
    }
  }
}
