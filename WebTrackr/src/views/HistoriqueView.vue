<template>
  <div class="page">
    <h1>Historique</h1>

    <div class="card">
      <div class="grid grid-3">
        <div>
          <label>Période</label>
          <select v-model="days">
            <option :value="1">24h</option>
            <option :value="3">3 jours</option>
            <option :value="7">7 jours</option>
            <option :value="14">14 jours</option>
            <option :value="30">30 jours</option>
          </select>
        </div>

        <div>
          <label>Module</label>
          <select v-model="moduleKey">
            <option value="">Tous</option>
            <option v-for="m in modules" :key="m._id" :value="m.key">
              {{ m.name }}
            </option>
          </select>
        </div>

        <div style="display:flex; align-items:flex-end;">
          <button @click="reload" :disabled="loading">Recharger</button>
        </div>
      </div>

      <p class="muted" style="margin-top:.75rem">
        Les séances sont reconstruites depuis les données enregistrées.
      </p>
    </div>

    <div v-if="loading" class="card" style="margin-top:1rem;">
      Chargement…
    </div>

    <div v-else class="grid" style="margin-top:1rem;">
      <div v-if="sessions.length === 0" class="card">
        Aucune séance trouvée sur la période.
      </div>

      <div v-for="s in sessions" :key="s._id" class="card">
        <div style="display:flex; justify-content:space-between; gap:.75rem; flex-wrap:wrap;">
          <div>
            <div style="font-weight:900; font-size:1.05rem;">
              {{ formatDate(s.startDate) }} - Score {{ s.stats.score }}
            </div>
            <div class="muted" style="font-size:.9rem;">
              Durée: {{ formatDuration(s.stats?.durationMs) }}
              • Distance: {{ fmtKm(s.stats?.distanceKm) }} km
              • Pas: {{ s.stats?.steps ?? 0 }}
            </div>
          </div>

          <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
            <span class="badge">HR avg: {{ fmt(s.stats?.hrAvg) }}</span>
            <span class="badge">HR max: {{ fmt(s.stats?.hrMax) }}</span>
            <span class="badge">Stress: {{ s.stats?.stress ?? '—' }}</span>
          </div>
        </div>

        <hr class="hr"/>

        <router-link :to="`/sessions/${s._id}`">
          Voir le détail →
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useSessionStore } from '../store/session.store'
  import { useModuleStore } from '../store/module.store'
  
  const sessionStore = useSessionStore()
  const moduleStore = useModuleStore()
  const { modules } = storeToRefs(moduleStore)
  
  const days = ref(7)
  const moduleKey = ref('')
  const loading = ref(false)
  const sessions = ref([])
  
  onMounted(async () => {
    await moduleStore.fetch()
    await reload()
  })
  
  async function reload() {
    loading.value = true
    try {
      let list = await sessionStore.fetchHistory()
  
      const minDate = Date.now() - days.value * 24 * 3600 * 1000
      list = list.filter(s => new Date(s.startDate).getTime() >= minDate)
  
      if (moduleKey.value) {
        list = list.filter(s => s.module?.key === moduleKey.value)
      }
  
      sessions.value = list
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
  function fmtKm(v) {
    return (v ?? 0).toFixed(2)
  }
  </script>
  