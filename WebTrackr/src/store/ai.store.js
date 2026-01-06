import { defineStore } from 'pinia'
import { trainModel, predictSession } from '../services/ai.service'

export const useAiStore = defineStore('ai', {
  state: () => ({
    loading: false,
    lastResult: null,
    error: null,
  }),

  actions: {
    async train() {
      this.loading = true
      try {
        this.lastResult = await trainModel()
      } catch (e) {
        this.error = e
      } finally {
        this.loading = false
      }
    },

    async predict(sessionId) {
      this.loading = true
      try {
        this.lastResult = await predictSession(sessionId)
      } catch (e) {
        this.error = e
      } finally {
        this.loading = false
      }
    }
  }
})
