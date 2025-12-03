import api from './api.service'

export default {
  async getUsers() {
    const res = await api.get('/user/getusers')
    return res.data.data || []
  },
}
