import api from './api.service'

export default {
  async getModules() {
    const res = await api.get('/module/get')
    return res.data.data || []
  },

  async register(payload) {
    const res = await api.post('/module/register', payload)
    return res.data
  },
}
