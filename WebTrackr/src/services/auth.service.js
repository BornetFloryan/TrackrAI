import api from './api.service'

export default {
  async login(login, password) {
    try {
      const res = await api.post('/auth/signin', { login, password })
      return res.data
    } catch (err) {
      throw err.response?.data || err
    }
  },
}
