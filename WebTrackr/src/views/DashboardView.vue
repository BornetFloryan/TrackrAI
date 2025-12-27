<template>
  <div class="page">
    <h1>Dashboard</h1>

    <div class="card">
      <div class="grid grid-3">
        <div>
          <label>Période</label>
          <select v-model="days">
            <option :value="1">24h</option>
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
          <button @click="reload" :disabled="loading">Analyser</button>
        </div>
      </div>

      <p class="muted" style="margin-top:.75rem">
        Indicateurs calculés depuis tes séances enregistrées.
      </p>
    </div>

    <div v-if="loading" class="card" style="margin-top:1rem;">
      Chargement…
    </div>

    <template v-else>
      <div class="grid grid-3" style="margin-top:1rem;">
        <StatCard title="Distance totale" :value="totalDistanceLabel" />
        <StatCard title="HR moyenne" :value="hrAvgLabel" :sub="`HR max: ${hrMaxLabel}`" />
        <StatCard title="Stress moyen" :value="stressAvgLabel" :sub="`Pas totaux: ${stepsTotalLabel}`" />
      </div>

      <div v-if="sessions.length === 0" class="card" style="margin-top:1rem;">
        Aucune séance sur la période sélectionnée.
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useModuleStore } from '../store/module.store'
import { useSessionStore } from '../store/session.store'
import StatCard from '../components/StatCard.vue'

const moduleStore = useModuleStore()
const sessionStore = useSessionStore()
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

/* =========================
   STATS (SAFE)
========================= */
const totalDistanceLabel = computed(() =>
  `${sessions.value.reduce((a, s) => a + (s.distanceKm ?? 0), 0).toFixed(2)} km`
)

const hrAvgLabel = computed(() => {
  const vals = sessions.value.map(s => s.hrAvg).filter(v => v != null)
  return vals.length ? `${Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)} bpm` : '—'
})

const hrMaxLabel = computed(() => {
  const vals = sessions.value.map(s => s.hrMax).filter(v => v != null)
  return vals.length ? `${Math.round(Math.max(...vals))} bpm` : '—'
})

const stepsTotalLabel = computed(() =>
  `${sessions.value.reduce((a, s) => a + (s.steps ?? 0), 0)}`
)

const stressAvgLabel = computed(() => {
  const vals = sessions.value.map(s => s.stress).filter(v => v != null)
  return vals.length ? `${Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)}/100` : '—'
})
</script>
