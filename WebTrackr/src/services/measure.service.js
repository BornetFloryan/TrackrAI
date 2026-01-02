import api from './api.service'

export default {
  async getMeasures(moduleKey = null, after = null, until = null) {
    const params = {}
    if (moduleKey) params.key = moduleKey
    if (after) params.after = after
    if (until) params.until = until

    const res = await api.get('/measure/get', { params })
    if (res.data.error !== 0) throw new Error(res.data.data)
    return res.data.data
  },
  async fetchAnalysis(analysisId) {
    console.log('Fetching analysis', analysisId)
    const res = await fetch(`/trackrapi/analysis/${analysisId}`)
    if (!res.ok) throw new Error('Analysis not found')
      const json = await res.json()
    return json.data
  }
}
