import { defineStore } from 'pinia'
import measureService from '../services/measure.service'

export const useMeasureStore = defineStore('measure', {
  state: () => ({
    list: [],
    analyses: [],
  }),

  actions: {
    async fetch(moduleKey = null, after = null, until = null) {
      this.list = await measureService.getMeasures(moduleKey, after, until)
      return this.list
    },
    async fetchAnalyses(limit = 50) {
      this.analyses = await measureService.fetchAnalyses(limit)
      return this.analyses
    },
  },
})
