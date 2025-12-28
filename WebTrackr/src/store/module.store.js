import { defineStore } from "pinia";
import moduleService from "../services/module.service";

export const useModuleStore = defineStore("module", {
  state: () => ({
    modules: [],
    loading: false,
  }),

  actions: {
    async fetch({ silent = false } = {}) {
      if (!silent) this.loading = true;
      try {
        this.modules = await moduleService.getModules();
      } finally {
        if (!silent) this.loading = false;
      }
    },
    async register(payload) {
      return moduleService.register(payload);
    },

    async create(payload) {
      return moduleService.create(payload);
    },

    async update(idModule, data) {
      return moduleService.update(idModule, data);
    },
  },
});
