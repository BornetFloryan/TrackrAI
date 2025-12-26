import api from './api.service';

export default {
    start(moduleKey) {
        return api.post('/session/start', { moduleKey });
    },

    stop(moduleKey) {
        return api.post('/session/stop', { moduleKey });
    },

    active(sessionId) {
        return api.post('/session/active', { sessionId });
    }
};