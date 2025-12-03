import api from './api.service'

export default {
  async getMeasures(moduleKey = null) {
    const route = moduleKey
      ? `/measure/get?key=${moduleKey}`
      : `/measure/get`

    const res = await api.get(route)
    return res.data.data || []
  },
}
