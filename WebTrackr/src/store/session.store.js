import { defineStore } from 'pinia'
import sessionService from '../services/session.service'

export const useSessionStore = defineStore('session', {
  state: () => ({
    current: null,
  }),

  getters: {
    isRunning: (state) => state.current !== null,
    duration: (state) =>
      state.current ? Date.now() - state.current.startTime : 0,
  },

  actions: {
    start(moduleKey, sportType = 'running', notes = '') {
      this.current = {
        moduleKey,
        sportType,
        notes,
        startTime: Date.now(),
      }
    },

    stop() {
      this.current = null
    },
  },
})
