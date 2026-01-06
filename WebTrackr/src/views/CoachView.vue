<template>
  <div class="page">
    <h1>Coach</h1>

    <div class="card">
      <div class="grid grid-3">
        <div>
          <label>Sportif</label>
          <select v-model="userId">
            <option value="">Tous les sportifs</option>
            <option v-for="u in athletes" :key="u._id" :value="u._id">
              {{ u.login }}
            </option>
          </select>
        </div>

        <div>
          <label>Date début</label>
          <input type="date" v-model="dateFrom" />
        </div>

        <div>
          <label>Date fin</label>
          <input type="date" v-model="dateTo" />
        </div>
      </div>

      <div style="margin-top:.75rem">
        <button @click="reload" :disabled="loading">
          Filtrer
        </button>
      </div>

      <p class="muted" style="margin-top:.75rem">
        Vue coach : analyse des performances et de la charge par sportif.
      </p>
    </div>
    <div class="card" style="margin-top:1rem;">
      <label>Métrique comparée</label>
      <select v-model="metric">
        <option value="score">Score global</option>
        <option value="distanceKm">Distance</option>
        <option value="hrAvg">Fréquence cardiaque moyenne</option>
        <option value="stress">Stress</option>
        <option value="durationMin">Durée (min)</option>
        <option value="steps">Pas</option>
      </select>
    </div>

    <CoachComparisonChart v-if="!loading && sessions.length" :sessions="sessions" :metric="metric" />

    <div v-if="loading" class="card" style="margin-top:1rem;">
      Chargement…
    </div>

    <template v-else>
      <div class="grid grid-3" style="margin-top:1rem;">
        <StatCard title="Séances" :value="sessions.length" />
        <StatCard title="Distance totale" :value="distanceLabel" />
        <StatCard title="Pas totaux" :value="stepsLabel" />
      </div>

      <div class="grid" style="margin-top:1rem;">
        <div v-if="sessions.length === 0" class="card muted">
          Aucune séance sur la période.
        </div>

        <div v-for="s in sessions" :key="s._id" class="card clickable">
          <div style="display:flex; justify-content:space-between; gap:.75rem; flex-wrap:wrap;">
            <div>
              <div style="font-weight:900;">
                {{ s.user?.login || '—' }}
              </div>
              <div class="muted">
                {{ formatDate(s.startDate) }} • {{ formatDuration(s.stats?.durationMs) }}
              </div>
              <div class="muted">
                Module : {{ s.module?.name || '—' }}
              </div>
            </div>

            <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
              <span class="badge">Score: {{ fmt(s.score) }}</span>
              <span class="badge">Dist: {{ s.stats?.distanceKm?.toFixed(2) || '0.00' }} km</span>
              <span class="badge">HR avg: {{ fmt(s.stats?.hrAvg) }}</span>
              <span class="badge">Stress: {{ s.stats?.stress ?? '—' }}</span>
            </div>
          </div>

          <hr class="hr" />

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
import CoachComparisonChart from '../components/CoachComparisonChart.vue'

const sessionStore = useSessionStore()
const userStore = useUserStore()

const athletes = ref([])
const sessions = ref([])

const userId = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const loading = ref(false)
const metric = ref('score')

onMounted(async () => {
  await userStore.fetch()
  athletes.value = userStore.users.filter(u => u.rights.includes('basic'))
  await reload()
})

async function reload() {
  loading.value = true
  try {
    let list = await sessionStore.fetchHistory()

    if (dateFrom.value) {
      const fromTs = new Date(dateFrom.value).getTime()
      list = list.filter(s => new Date(s.startDate).getTime() >= fromTs)
    }

    if (dateTo.value) {
      const toTs = new Date(dateTo.value).getTime() + 24 * 3600 * 1000
      list = list.filter(s => new Date(s.startDate).getTime() <= toTs)
    }

    if (userId.value) {
      list = list.filter(s => s.user?._id === userId.value)
    }

    sessions.value = list.map(s => ({
      ...s,
      score: s.stats?.score?.global ?? null,
      durationMin: Math.round((s.stats?.durationMs ?? 0) / 60000),
      steps: s.stats?.steps ?? 0,
    }))
  } finally {
    loading.value = false
  }
}

function formatDate(d) {
  return new Date(d).toLocaleString()
}

function formatDuration(ms = 0) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function fmt(v) {
  return v == null ? '—' : Math.round(v)
}

const distanceLabel = computed(() =>
  `${sessions.value.reduce((a, s) => a + (s.stats?.distanceKm || 0), 0).toFixed(2)} km`
)

const stepsLabel = computed(() =>
  `${sessions.value.reduce((a, s) => a + (s.stats?.steps || 0), 0)}`
)
</script>
