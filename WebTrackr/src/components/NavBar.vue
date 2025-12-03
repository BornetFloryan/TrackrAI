<template>
  <header class="app-header" :class="{ sticky: isSticky }" role="banner">
    <div class="header-inner">
      <router-link to="/" class="brand" aria-label="TrackrAI - accueil">
        <span class="brand-title">TrackrAI</span>
      </router-link>

      <nav class="nav" role="navigation" aria-label="Principale" :aria-expanded="menuOpen">
        <button class="menu-toggle" @click="menuOpen = !menuOpen" :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'">
          <span class="hamburger" aria-hidden="true"></span>
        </button>

        <ul :class="['nav-list', { open: menuOpen }]">
          <li><router-link to="/dashboard" class="nav-link">Dashboard</router-link></li>
          <li><router-link to="/session/start" class="nav-link">Nouvelle séance</router-link></li>
          <li><router-link to="/sessions" class="nav-link">Historique</router-link></li>
          <li v-if="isAdmin"><router-link to="/admin" class="nav-link">Admin</router-link></li>
        </ul>
      </nav>

      <div class="actions" v-if="isAuthenticated">
        <div class="user" title="Profil">
          <div class="avatar" aria-hidden="true">{{ initials }}</div>
          <span class="username">{{ displayName }}</span>
        </div>

        <button class="btn-logout" @click="handleLogout" aria-label="Se déconnecter">Déconnexion</button>
      </div>

      <div class="auth-actions" v-else>
        <router-link to="/login" class="btn-login">Se connecter</router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.store'

const auth = useAuthStore()
const router = useRouter()

const menuOpen = ref(false)
const isSticky = ref(false)

const isAuthenticated = computed(() => !!auth.token)
const isAdmin = computed(() => Array.isArray(auth.rights) && auth.rights.includes('admin'))
const displayName = computed(() => auth.username || auth.login || '')
const initials = computed(() => {
  const name = displayName.value || ''
  return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() || 'U'
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function onScroll() {
  isSticky.value = window.scrollY > 8
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>