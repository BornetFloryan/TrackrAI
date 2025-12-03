import { defineStore } from 'pinia'
import axios from 'axios'
import authService from '../services/auth.service'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('trackr_token') || null,
    rights: JSON.parse(localStorage.getItem('trackr_rights') || '[]'),
    login: localStorage.getItem('trackr_login') || null,
  }),

  getters: {
    isAdmin: (state) => state.rights.includes('admin'),
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async signin(login, password) {
      delete axios.defaults.headers.common['Authorization']

      const answer = await authService.login(login, password)

      if (answer.error && answer.error !== 0) {
        throw new Error(answer.data || 'Erreur de connexion')
      }

      const payload = answer.data || {}
      this.token = payload.token || null
      this.rights = payload.rights || []
      this.login = login

      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        localStorage.setItem('trackr_token', this.token)
      } else {
        delete axios.defaults.headers.common['Authorization']
        localStorage.removeItem('trackr_token')
      }

      localStorage.setItem('trackr_rights', JSON.stringify(this.rights))
      localStorage.setItem('trackr_login', this.login || '')

      return payload
    },

    logout() {
      this.token = null
      this.rights = []
      this.login = null

      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('trackr_token')
      localStorage.removeItem('trackr_rights')
      localStorage.removeItem('trackr_login')
    },

    restore() {
      const token = localStorage.getItem('trackr_token')
      if (token) {
        this.token = token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        this.token = null
        delete axios.defaults.headers.common['Authorization']
      }

      const rights = localStorage.getItem('trackr_rights')
      this.rights = rights ? JSON.parse(rights) : []
      this.login = localStorage.getItem('trackr_login') || null
    },
  },
})