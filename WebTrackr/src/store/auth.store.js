import { defineStore } from "pinia";
import authAPI from "../services/auth.service";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        token: null,
        user: null,
    }),

    actions: {
        async login(login, password) {
            const data = await authAPI.login(login, password);
            this.token = data.token;
            this.user = data.user;
        },

        logout() {
            this.token = null;
            this.user = null;
        },
    },
});
