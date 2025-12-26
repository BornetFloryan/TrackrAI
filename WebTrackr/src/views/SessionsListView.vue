<template>
  <div>
    <h1>Historique des séances</h1>

    <div v-if="store.loading">Chargement...</div>

    <ul v-else>
      <li v-for="(group, day) in grouped" :key="day">
        <strong>{{ day }}</strong>
        <ul>
          <li v-for="session in group" :key="session.id">
            <router-link :to="`/sessions/${session.id}`">
              {{ session.sportType || 'Sport' }} —
              {{ formatDuration(session.duration) }}
            </router-link>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSessionStore } from '../store/session.store'

const store = useSessionStore()

onMounted(async () => {
  await store.fetchSessions()
})

const grouped = computed(() => {
  const byDay = {}

  store.sessions.forEach(s => {
    const date = new Date(s.startTime || s.date).toLocaleDateString()
    if (!byDay[date]) byDay[date] = []
    byDay[date].push(s)
  })

  return byDay
})

function formatDuration(ms) {
  if (!ms) return '—'
  const min = Math.floor(ms / 60000)
  return `${min} min`
}
</script>
