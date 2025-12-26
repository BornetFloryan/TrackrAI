import api from './api.service'

export default {
    start(moduleKey, sport) {
        return api.post('/session/start', {
            moduleKey,
            sport
        })
    },

    stop(sessionId) {
        return api.post('/session/stop', {
            sessionId
        })
    },

    active(sessionId) {
        return api.post('/session/active', {
            sessionId
        })
    }
}
