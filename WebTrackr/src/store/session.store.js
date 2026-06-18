import { defineStore } from 'pinia'
import sessionService from '../services/session.service'
import apiService from '../services/api.service'

export const useSessionStore = defineStore('session', {
  state: () => ({
    sessionId: null,
    sessionMongoId: null,
    moduleKey: null,
    startDate: null,
    lastMeasureAt: null,
    lastHeartRateAt: null,
    loading: false,
    error: null,
    history: [],
  }),

  actions: {
    applyActiveSession(payload, moduleKey = null) {
      this.sessionId = payload?.sessionId || null
      this.sessionMongoId = payload?.sessionMongoId || null
      this.moduleKey = payload?.moduleKey || moduleKey || this.moduleKey
      this.startDate = payload?.startDate || null
      this.lastMeasureAt = payload?.lastMeasureAt || null
      this.lastHeartRateAt = payload?.lastHeartRateAt || null
    },

    clearActiveSession() {
      this.sessionId = null
      this.sessionMongoId = null
      this.moduleKey = null
      this.startDate = null
      this.lastMeasureAt = null
      this.lastHeartRateAt = null
    },

    async start(moduleKey) {
      this.loading = true
      this.error = null

      try {
        const res = await sessionService.start(moduleKey)
        this.applyActiveSession(res, moduleKey)
        return res
      } catch (err) {
        this.error = err.response?.data || err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async stop() {
      if (!this.moduleKey) return null

      this.loading = true
      this.error = null

      try {
        const res = await sessionService.stop(this.moduleKey)
        return res
      } catch (err) {
        this.error = err.response?.data || err.message
        throw err
      } finally {
        this.clearActiveSession()
        this.loading = false
      }
    },

    async syncActiveForModule(moduleKey) {
      const payload = await sessionService.activeForModule(moduleKey)

      if (payload?.active) {
        this.applyActiveSession(payload, moduleKey)
      } else if (this.moduleKey === moduleKey) {
        this.clearActiveSession()
      }

      return payload
    },

    async fetchHistory() {
      const res = await apiService.get('/session/history')
      this.history = res.data.data
      return this.history
    },
  },
})