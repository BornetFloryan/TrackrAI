import { defineStore } from "pinia";
import authService from "../services/auth.service";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("trackr_token") || null,
    rights: JSON.parse(localStorage.getItem("trackr_rights") || "[]"),
    login: localStorage.getItem("trackr_login") || null,
  }),

  getters: {
    isAuthenticated: (s) => !!s.token,
    isAdmin: (s) => Array.isArray(s.rights) && s.rights.includes("admin"),
    isCoach: (s) => Array.isArray(s.rights) && s.rights.includes("coach"),
  },

  actions: {
    async signin(login, password) {
      const answer = await authService.login(login, password);

      if (!answer || !answer.token) {
        throw new Error("AUTH_FAILED");
      }

      this.token = answer.token;
      this.rights = answer.rights || [];
      this.login = login;

      localStorage.setItem("trackr_token", this.token);
      localStorage.setItem("trackr_rights", JSON.stringify(this.rights));
      localStorage.setItem("trackr_login", login);

      return answer;
    },

    logout() {
      this.token = null;
      this.rights = [];
      this.login = null;

      localStorage.removeItem("trackr_token");
      localStorage.removeItem("trackr_rights");
      localStorage.removeItem("trackr_login");
    },

    restore() {
      this.token = localStorage.getItem("trackr_token");
      this.rights = JSON.parse(localStorage.getItem("trackr_rights") || "[]");
      this.login = localStorage.getItem("trackr_login");
    },
  },
});
