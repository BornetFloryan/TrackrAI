<template>
  <div class="page">
    <h1>Coach</h1>

    <!-- FILTRES -->
    <div class="card">
      <div class="grid grid-3">
        <div>
          <label>Sportif</label>
          <select v-model="userId">
            <option value="">Tous</option>
            <option v-for="u in users" :key="u._id" :value="u._id">
              {{ u.login }}
            </option>
          </select>
        </div>

        <div>
          <label>Période</label>
          <select v-model="days">
            <option :value="7">7 jours</option>
            <option :value="14">14 jours</option>
            <option :value="30">30 jours</option>
          </select>
        </div>

        <div style="display:flex; align-items:flex-end;">
          <button @click="reload" :disabled="loading">Analyser</button>
        </div>
      </div>

      <p class="muted" style="margin-top:.5rem">
        Vue coach : suivi multi-sportifs (sessions, charge, progression).
      </p>
    </div>

    <div v-if="loading" class="card" style="margin-top:1rem;">
      Chargement…
    </div>

    <template v-else>
      <!-- STATS GLOBALES -->
      <div class="grid grid-3" style="margin-top:1rem;">
        <StatCard title="Séances" :value="sessions.length" />
        <StatCard title="Distance totale" :value="distanceLabel" />
        <StatCard title="Pas totaux" :value="stepsLabel" />
      </div>

      <!-- LISTE SESSIONS -->
      <div class="grid" style="margin-top:1rem;">
        <div v-if="sessions.length === 0" class="card">
          Aucune séance sur la période.
        </div>

        <div v-for="s in sessions" :key="s._id" class="card">
          <div style="display:flex; justify-content:space-between; gap:.75rem; flex-wrap:wrap;">
            <div>
              <div style="font-weight:900;">
                {{ s.user?.login || '—' }}
              </div>
              <div class="muted">
                {{ formatDate(s.startDate) }} • {{ formatDuration(s.durationMs) }}
              </div>
              <div class="muted">
                Module : {{ s.module?.name || '—' }}
              </div>
            </div>

            <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
              <span class="badge">Dist: {{ s.distanceKm?.toFixed(2) || '0.00' }} km</span>
              <span class="badge">HR avg: {{ fmt(s.hrAvg) }}</span>
              <span class="badge">Stress: {{ s.stress ?? '—' }}</span>
            </div>
          </div>

          <hr class="hr"/>

          <router-link :to="`/sessions/${s._id}`">
            Voir le détail →
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSessionStore } from '../store/session.store'
import { useUserStore } from '../store/user.store'
import StatCard from '../components/StatCard.vue'

const sessionStore = useSessionStore()
const userStore = useUserStore()

const users = ref([])
const sessions = ref([])

const userId = ref('')
const days = ref(14)
const loading = ref(false)

onMounted(async () => {
  await userStore.fetch()
  users.value = userStore.users.filter(u => !u.rights.includes('admin'))
  await reload()
})

async function reload() {
  loading.value = true
  try {
    let list = await sessionStore.fetchHistory()

    const minDate = Date.now() - days.value * 24 * 3600 * 1000
    list = list.filter(s => new Date(s.startDate).getTime() >= minDate)

    if (userId.value) {
      list = list.filter(s => s.user?._id === userId.value)
    }

    sessions.value = list
  } finally {
    loading.value = false
  }
}

/* =========================
   HELPERS
========================= */
function formatDate(d) {
  return new Date(d).toLocaleString()
}
function formatDuration(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}
function fmt(v) {
  if (v == null) return '—'
  return Math.round(v)
}

/* =========================
   STATS
========================= */
const distanceLabel = computed(() => {
  const d = sessions.value.reduce((a, s) => a + (s.distanceKm || 0), 0)
  return `${d.toFixed(2)} km`
})
const stepsLabel = computed(() => {
  const n = sessions.value.reduce((a, s) => a + (s.steps || 0), 0)
  return `${n}`
})
</script>
