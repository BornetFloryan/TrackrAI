<template>
  <div class="page" style="min-height: calc(100vh - 40px); display:grid; place-items:center;">
    <div class="card" style="max-width: 420px; width:100%;">
      <div style="display:flex; align-items:center; gap:.7rem; margin-bottom: .6rem;">
        <div style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,rgba(110,231,255,.9),rgba(167,139,250,.9));"></div>
        <div>
          <div style="font-weight:900; font-size:1.15rem;">TrackrAI</div>
          <div style="color:var(--muted); font-size:.9rem;">Connexion</div>
        </div>
      </div>

      <form @submit.prevent="submit" class="grid" style="gap:.75rem;">
        <div>
          <label>Login</label>
          <input v-model="login" placeholder="admin / test / ..." autocomplete="username" />
        </div>
        <div>
          <label>Mot de passe</label>
          <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>

        <p v-if="error" style="color:var(--danger); margin:0;">{{ error }}</p>
      </form>

      <p style="color:var(--muted); margin:.75rem 0 0 0; font-size:.9rem;">
        L’API utilise <code>x-session-id</code> (token de session).
      </p>
    </div>
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
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.signin(login.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = 'Login ou mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>
