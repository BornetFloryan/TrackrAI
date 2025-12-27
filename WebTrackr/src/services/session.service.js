import api from './api.service'

export default {
  async start(moduleKey) {
    const res = await api.post('/session/start', { moduleKey })
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data // { sessionId }
  },

  async stop(moduleKey) {
    const res = await api.post('/session/stop', { moduleKey })
    if (res.data.error !== 0) throw new Error(res.data.data)
    return true
  },

  async activeForModule(moduleKey) {
    const res = await api.post('/session/active-for-module', { moduleKey })
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },

  async history() {
    const res = await api.get('/session/history')
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },
}
