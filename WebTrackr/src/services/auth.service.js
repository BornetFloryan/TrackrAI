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

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (_) {
      // Local logout still has to happen if the server session is already expired.
    }
  },

  async refresh(refreshToken) {
    const res = await api.post('/auth/refresh', { refreshToken })
    if (!res.data || res.data.error !== 0) {
      throw new Error(res.data?.data || 'AUTH_ERROR')
    }
    return res.data.data
  },

  async me() {
    const res = await api.get('/auth/me')
    if (!res.data || res.data.error !== 0) {
      throw new Error(res.data?.data || 'AUTH_ERROR')
    }
    return res.data.data
  },
}
