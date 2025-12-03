import { defineStore } from 'pinia'
import moduleService from '../services/module.service'

export const useModuleStore = defineStore('module', {
  state: () => ({
    modules: [],
  }),

  actions: {
    async fetch() {
      try {
        const list = await moduleService.getModules()
        this.modules = list
      } catch (err) {
        console.error('Erreur fetch modules :', err)
        this.modules = []
      }
    },

    async register(payload) {
      return moduleService.register(payload)
    },
  },
})
