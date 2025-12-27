import { defineStore } from 'pinia'
import measureService from '../services/measure.service'

export const useMeasureStore = defineStore('measure', {
  state: () => ({
    list: [],
  }),

  actions: {
    async fetch(moduleKey = null, after = null, until = null) {
      this.list = await measureService.getMeasures(moduleKey, after, until)
      return this.list
    },
  },
})
