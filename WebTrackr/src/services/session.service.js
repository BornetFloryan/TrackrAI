import api from './api.service'

const mockSessions = [
  {
    id: 1,
    date: '2025-03-10',
    duration: 3600,
    distance: 10.2,
    calories: 720,
    avgHR: 145,
  },
  {
    id: 2,
    date: '2025-03-12',
    duration: 2700,
    distance: 7.4,
    calories: 510,
    avgHR: 138,
  },
]

export default {
  async saveSession(payload) {
    try {
      return await api.post('/session/save', payload)
    } catch (e) {
      console.warn('API indisponible — saveSession mock')
      return Promise.resolve({ data: payload })
    }
  },

  async getSessions() {
    try {
      const res = await api.get('/session/all')
      return res.data
    } catch (e) {
      console.warn('API indisponible — sessions mock')
      return Promise.resolve(mockSessions)
    }
  },

  async getSessionById(id) {
    try {
      const res = await api.get(`/session/${id}`)
      return res.data
    } catch (e) {
      console.warn('API indisponible — session mock')
      const session = mockSessions.find(s => s.id === Number(id))
      if (!session) throw new Error('Séance introuvable')
      return Promise.resolve(session)
    }
  },
}
