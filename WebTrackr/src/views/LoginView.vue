<template>
  <div class="login-container">
    <h2>Connexion</h2>

    <form @submit.prevent="handleLogin">
      <input v-model="login" placeholder="Login" required />
      <input type="password" v-model="password" placeholder="Mot de passe" required />

      <button type="submit">Se connecter</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../store/auth.store";
import { useRouter } from "vue-router";

const login = ref("");
const password = ref("");
const error = ref("");

const authStore = useAuthStore();
const router = useRouter();

async function handleLogin() {
  try {
    await authStore.login(login.value, password.value);
    router.push("/dashboard");
  } catch (err) {
    error.value = "Identifiants invalides";
  }
}
</script>

<style>
.login-container {
  max-width: 300px;
  margin: auto;
  padding: 40px;
}
.error {
  color: red;
}
</style>
