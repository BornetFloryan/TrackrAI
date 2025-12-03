<template>
  <div class="login">
    <h2>Connexion</h2>

    <form @submit.prevent="submit">
      <input v-model="login" placeholder="Login" />
      <input v-model="password" type="password" placeholder="Mot de passe" />
      <button type="submit">Connexion</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth.store'
import { useRouter } from 'vue-router'

const auth = useAuthStore()

const router = useRouter()
const login = ref('')
const password = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  if (typeof auth.signin !== 'function') {
    console.error('auth.signin manquant — Pinia non initialisé ou export incorrect', auth)
    error.value = 'Erreur interne (store absent)'
    return
  }
  try {
    await auth.signin(login.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    console.error('login failed', e)
    error.value = 'Identifiants invalides'
  }
}
</script>