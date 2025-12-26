import { defineStore } from 'pinia'
import sessionService from '../services/session.service'

export const useSessionStore = defineStore('session', {
  state: () => ({
    /* ======================
       SESSION EN COURS
    ====================== */
    current: null,

    /* ======================
       HISTORIQUE
    ====================== */
    sessions: [],
    selected: null,
    loading: false,
  }),

  getters: {
    /* ----- Runtime ----- */
    isRunning: (state) => state.current !== null,
    duration: (state) =>
      state.current ? Date.now() - state.current.startTime : 0,

    /* ----- Historique ----- */
    hasSessions: (state) => state.sessions.length > 0,
  },

  actions: {
    /* ======================
       SESSION EN COURS
    ====================== */
    start(moduleKey, sportType = 'running', notes = '') {
      this.current = {
        moduleKey,
        sportType,
        notes,
        startTime: Date.now(),
      }
    },

    async stop() {
      if (!this.current) return

      const payload = {
        ...this.current,
        endTime: Date.now(),
        duration: Date.now() - this.current.startTime,
      }

      try {
        await sessionService.saveSession(payload)
      } catch (e) {
        console.warn('Erreur sauvegarde session', e)
      }

      this.current = null
    },

    /* ======================
       HISTORIQUE
    ====================== */
    async fetchSessions() {
      this.loading = true
      this.sessions = await sessionService.getSessions()
      this.loading = false
    },

    async fetchSessionById(id) {
      this.loading = true
      this.selected = await sessionService.getSessionById(id)
      this.loading = false
    },
  },
})
