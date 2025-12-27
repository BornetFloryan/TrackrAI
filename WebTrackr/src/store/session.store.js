import { defineStore } from 'pinia';
import sessionService from '../services/session.service';

export const useSessionStore = defineStore('session', {
  state: () => ({
    sessionId: null,
    moduleKey: null,
    loading: false,
    error: null,
  }),

  actions: {
    async start(moduleKey) {
      this.loading = true;
      this.error = null;

      try {
        const res = await sessionService.start(moduleKey);
        this.sessionId = res.sessionId;
        this.moduleKey = moduleKey;
        return this.sessionId;
      } catch (err) {
        this.error = err.response?.data || err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async stop() {
      if (!this.moduleKey || !this.sessionId) return;

      this.loading = true;
      this.error = null;

      try {
        await sessionService.stop(this.moduleKey);
        this.sessionId = null;
        this.moduleKey = null;
      } catch (err) {
        this.error = err.response?.data || err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async syncActiveForModule(moduleKey) {
      this.loading = true;
      this.error = null;

      try {
        const res = await sessionService.activeForModule(moduleKey);
        const payload = res.data.data;

        if (payload?.active) {
          this.sessionId = payload.sessionId;
          this.moduleKey = moduleKey;
        } else {
          this.sessionId = null;
          this.moduleKey = null;
        }

        return payload;
      } catch (err) {
        this.error = err.response?.data || err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async fetchHistory() {
      this.loading = true
      try {
      return await sessionService.history()
      } finally {
        this.loading = false
      }
    }
    
  }
});
