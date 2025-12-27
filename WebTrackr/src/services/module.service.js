import api from './api.service'

export default {
  async getModules() {
    const res = await api.get('/module/get')
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },

  async register(payload) {
    const res = await api.post('/module/register', payload)
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },

  async create(payload) {
    const res = await api.post('/module/create', payload)
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },

  async update(idModule, data) {
    const res = await api.patch('/module/update', { idModule, data })
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },
}
