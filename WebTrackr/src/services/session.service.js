import api from './api.service'

export default {
  async saveSession(payload) {
    return api.post('/session/save', payload)
  },

  async getSessions() {
    return api.get('/session/all')
  },

  async getSessionById(id) {
    return api.get(`/session/${id}`)
  }
}
