import api from './api.service'

export default {
  async getUsers() {
    const res = await api.get('/user/getusers')
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },

  async createUser(payload) {
    const res = await api.post('/user/create', payload)
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },

  async updateUser(idUser, data) {
    const res = await api.patch('/user/update', { idUser, data })
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },
}
