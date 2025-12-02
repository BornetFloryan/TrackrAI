// src/store/measure.store.js
import { defineStore } from 'pinia'
import measureAPI from '../services/measure.service'

export const useMeasureStore = defineStore('measure', {
    state: () => ({
        list: [],
    }),

    actions: {
        async fetch(moduleKey = null) {
            try {
                this.list = await measureAPI.getMeasures(moduleKey)
                return this.list
            } catch (err) {
                console.error('Failed to fetch measures:', err)
                this.list = []
                return this.list
            }
        },
    },
})