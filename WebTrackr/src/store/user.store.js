import { defineStore } from 'pinia'
import userService from '../services/user.service'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetch() {
      this.loading = true
      try {
        this.users = await userService.getUsers()
      } catch (e) {
        this.error = e.message
        this.users = []
      } finally {
        this.loading = false
      }
    },

    async create(payload) {
      return userService.createUser(payload)
    },

    async update(idUser, data) {
      return userService.updateUser(idUser, data)
    },
  },
})
