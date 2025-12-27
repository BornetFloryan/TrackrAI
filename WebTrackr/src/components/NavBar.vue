<template>
  <header class="app-header" :class="{ sticky: isSticky }">
    <div class="inner">
      <router-link v-if="isSportif" to="/dashboard" class="brand">
        <span class="logo"></span>
        <span class="title">TrackrAI</span>
      </router-link>

      <nav class="nav" :aria-expanded="menuOpen">
        <button class="burger" @click="menuOpen = !menuOpen" :aria-label="menuOpen ? 'Fermer' : 'Ouvrir'">
          ☰
        </button>

        <div class="links" :class="{ open: menuOpen }">
          <router-link v-if="isSportif" class="link" to="/dashboard">Dashboard</router-link>

          <!-- SPORTIF -->
          <router-link v-if="isSportif" class="link" to="/session/start">
            Nouvelle séance
          </router-link>

          <router-link v-if="isSportif" class="link" to="/sessions">
            Historique
          </router-link>

          <!-- COACH -->
          <router-link v-if="isCoach" class="link" to="/coach">
            Coach
          </router-link>

          <!-- ADMIN -->
          <router-link v-if="isAdmin" class="link" to="/admin">
            Admin
          </router-link>

          <!-- MOBILE -->
          <router-link v-if="isSportif" class="link" to="/mobile/video">
            Vidéo (mobile)
          </router-link>
        </div>

      </nav>

      <div class="right">
        <span v-if="isAuthenticated" class="badge">👤 {{ displayName }}</span>
        <button v-if="isAuthenticated" class="secondary" @click="logout">Déconnexion</button>
        <router-link v-else class="badge" to="/login">Se connecter</router-link>
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
const isAdmin = computed(() => auth.rights?.includes('admin'))
const isCoach = computed(() => auth.rights?.includes('coach'))
const isSportif = computed(() => auth.rights?.includes('basic'))

const displayName = computed(() => auth.login || 'Utilisateur')

function logout() {
  auth.logout()
  router.push('/login')
}

function onScroll() {
  isSticky.value = window.scrollY > 8
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>


<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(10px);
  background: rgba(5, 10, 20, .55);
  border-bottom: 1px solid var(--border);
}

.inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: .8rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: .6rem;
  text-decoration: none;
}

.logo {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(110, 231, 255, .9), rgba(167, 139, 250, .9));
  box-shadow: 0 8px 25px rgba(110, 231, 255, .15);
}

.title {
  font-weight: 800;
  letter-spacing: .2px;
}

.nav {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.burger {
  display: none;
}

.links {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.link {
  padding: .45rem .65rem;
  border-radius: 10px;
  border: 1px solid transparent;
}

.link.router-link-active {
  border-color: var(--border);
  background: rgba(255, 255, 255, .04);
}

.right {
  display: flex;
  align-items: center;
  gap: .6rem;
}

@media (max-width: 860px) {
  .burger {
    display: inline-flex;
  }

  .links {
    display: none;
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    padding: .75rem 1rem;
    background: rgba(5, 10, 20, .92);
    border-bottom: 1px solid var(--border);
    flex-direction: column;
    align-items: flex-start;
  }

  .links.open {
    display: flex;
  }
}
</style>
