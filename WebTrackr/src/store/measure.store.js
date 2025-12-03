import { defineStore } from 'pinia'
import measureService from '../services/measure.service'

export const useMeasureStore = defineStore('measure', {
  state: () => ({
    list: [],
  }),

  actions: {
    async fetch(moduleKey = null) {
      try {
        this.list = await measureService.getMeasures(moduleKey)
      } catch (err) {
        console.error('Erreur fetch measures :', err)
        this.list = []
      }
      return this.list
    },
  },
})
