import { defineStore } from "pinia";
import authService from "../services/auth.service";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("trackr_token") || null,
    rights: JSON.parse(localStorage.getItem("trackr_rights") || "[]"),
    login: localStorage.getItem("trackr_login") || null,
    userId: localStorage.getItem("trackr_user_id") || null,
    coach: JSON.parse(localStorage.getItem("trackr_coach") || "null"),
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
      this.login = answer.login || login;
      this.userId = answer.userId || null;
      this.coach = answer.coach || null;

      localStorage.setItem("trackr_token", this.token);
      localStorage.setItem("trackr_rights", JSON.stringify(this.rights));
      localStorage.setItem("trackr_login", this.login);
      if (this.userId) localStorage.setItem("trackr_user_id", this.userId);
      localStorage.setItem("trackr_coach", JSON.stringify(this.coach));

      return answer;
    },

    logout() {
      this.token = null;
      this.rights = [];
      this.login = null;
      this.userId = null;
      this.coach = null;

      localStorage.removeItem("trackr_token");
      localStorage.removeItem("trackr_rights");
      localStorage.removeItem("trackr_login");
      localStorage.removeItem("trackr_user_id");
      localStorage.removeItem("trackr_coach");
    },

    restore() {
      this.token = localStorage.getItem("trackr_token");
      this.rights = JSON.parse(localStorage.getItem("trackr_rights") || "[]");
      this.login = localStorage.getItem("trackr_login");
      this.userId = localStorage.getItem("trackr_user_id");
      this.coach = JSON.parse(localStorage.getItem("trackr_coach") || "null");
    },
  },
});
