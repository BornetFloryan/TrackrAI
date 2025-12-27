import api from './api.service'

export default {
  async login(login, password) {

    const res = await api.post('/auth/signin', {
      login,
      password,
    })



    if (!res.data || res.data.error !== 0) {
      throw new Error(res.data?.data || 'AUTH_ERROR')
    }

    return res.data.data // { token, rights }
  },
}
