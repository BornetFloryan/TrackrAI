import { defineStore } from 'pinia'
import sessionService from '../services/session.service'

export const useSessionStore = defineStore('session', {
    state: () => ({
        sessionId: null,
        loading: false,
        error: null
    }),

    actions: {
        async start(moduleKey) {
            this.loading = true
            this.error = null

            try {
                const res = await sessionService.start(moduleKey)
                this.sessionId = res.data.payload.sessionId
                return this.sessionId
            } catch (err) {
                this.error = err.response?.data || err.message
                throw err
            } finally {
                this.loading = false
            }
        },

        async stop() {
            if (!this.sessionId) return

            this.loading = true
            try {
                await sessionService.stop(this.sessionId)
                this.sessionId = null
            } catch (err) {
                this.error = err.response?.data || err.message
                throw err
            } finally {
                this.loading = false
            }
        }
    }
})
