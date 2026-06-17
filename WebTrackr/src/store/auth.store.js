import { defineStore } from "pinia";
import authService from "../services/auth.service";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("trackr_token") || null,
    rights: JSON.parse(localStorage.getItem("trackr_rights") || "[]"),
    login: localStorage.getItem("trackr_login") || null,
    userId: localStorage.getItem("trackr_user_id") || null,
    coach: JSON.parse(localStorage.getItem("trackr_coach") || "null"),
    expiresAt: localStorage.getItem("trackr_expires_at") || null,
    refreshToken: localStorage.getItem("trackr_refresh_token") || null,
    refreshExpiresAt: localStorage.getItem("trackr_refresh_expires_at") || null,
  }),

  getters: {
    isAuthenticated: (s) => {
      if (!s.token) return false
      if (s.refreshExpiresAt) return new Date(s.refreshExpiresAt).getTime() > Date.now()
      return !s.expiresAt || new Date(s.expiresAt).getTime() > Date.now()
    },
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
      this.expiresAt = answer.expiresAt || null;
      this.refreshToken = answer.refreshToken || null;
      this.refreshExpiresAt = answer.refreshExpiresAt || null;

      localStorage.setItem("trackr_token", this.token);
      localStorage.setItem("trackr_rights", JSON.stringify(this.rights));
      localStorage.setItem("trackr_login", this.login);
      if (this.userId) localStorage.setItem("trackr_user_id", this.userId);
      localStorage.setItem("trackr_coach", JSON.stringify(this.coach));
      if (this.expiresAt) localStorage.setItem("trackr_expires_at", this.expiresAt);
      if (this.refreshToken) localStorage.setItem("trackr_refresh_token", this.refreshToken);
      if (this.refreshExpiresAt) localStorage.setItem("trackr_refresh_expires_at", this.refreshExpiresAt);

      return answer;
    },

    async logout() {
      if (this.token) {
        await authService.logout();
      }
      this.clear();
    },

    clear() {
      this.token = null;
      this.rights = [];
      this.login = null;
      this.userId = null;
      this.coach = null;
      this.expiresAt = null;
      this.refreshToken = null;
      this.refreshExpiresAt = null;

      localStorage.removeItem("trackr_token");
      localStorage.removeItem("trackr_rights");
      localStorage.removeItem("trackr_login");
      localStorage.removeItem("trackr_user_id");
      localStorage.removeItem("trackr_coach");
      localStorage.removeItem("trackr_expires_at");
      localStorage.removeItem("trackr_refresh_token");
      localStorage.removeItem("trackr_refresh_expires_at");
    },

    restore() {
      this.token = localStorage.getItem("trackr_token");
      this.rights = JSON.parse(localStorage.getItem("trackr_rights") || "[]");
      this.login = localStorage.getItem("trackr_login");
      this.userId = localStorage.getItem("trackr_user_id");
      this.coach = JSON.parse(localStorage.getItem("trackr_coach") || "null");
      this.expiresAt = localStorage.getItem("trackr_expires_at");
      this.refreshToken = localStorage.getItem("trackr_refresh_token");
      this.refreshExpiresAt = localStorage.getItem("trackr_refresh_expires_at");

      if (this.refreshExpiresAt && new Date(this.refreshExpiresAt).getTime() <= Date.now()) {
        this.clear();
      }
    },
  },
});
