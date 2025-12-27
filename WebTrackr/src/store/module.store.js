import { defineStore } from 'pinia'
import moduleService from '../services/module.service'

export const useModuleStore = defineStore('module', {
  state: () => ({
    modules: [],
    loading: false,
  }),

  actions: {
    async fetch() {
      this.loading = true
      try {
        this.modules = await moduleService.getModules()
      } finally {
        this.loading = false
      }
    },

    async register(payload) {
      return moduleService.register(payload)
    },

    async create(payload) {
      return moduleService.create(payload)
    },

    async update(idModule, data) {
      return moduleService.update(idModule, data)
    },
  },
})
