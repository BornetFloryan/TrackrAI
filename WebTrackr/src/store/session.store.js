import { defineStore } from 'pinia';
import sessionService from '../services/session.service';

export const useSessionStore = defineStore('session', {
    state: () => ({
        sessionId: null,
        loading: false,
        error: null
    }),

    actions: {
        async start(moduleKey) {
            this.loading = true;
            this.error = null;

            try {
                const res = await sessionService.start(moduleKey);
                this.sessionId = res.data.data.sessionId;
                return this.sessionId;
            } catch (err) {
                this.error = err.response?.data || err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async stop(moduleKey) {
            console.log("Attempting to stop session...");
            console.log("Current moduleKey:", moduleKey);
            if (!moduleKey) return;

            this.loading = true;
            try {
                console.log("Stopping session with moduleKey:", moduleKey);
                await sessionService.stop(moduleKey);
                console.log("Session stopped successfully.");
                this.sessionId = null;
            } catch (err) {
                this.error = err.response?.data || err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        }
    }
});
