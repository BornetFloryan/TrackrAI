import { defineStore } from 'pinia'
import userService from '../services/user.service'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
  }),

  actions: {
    async fetch() {
      try {
        this.users = await userService.getUsers()
      } catch (err) {
        console.error('Erreur fetch users :', err)
        this.users = []
      }
    },
  },
})
