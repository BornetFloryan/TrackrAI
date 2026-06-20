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

        <div style="display:flex; align-items:flex-end;">
          <button @click="reload" :disabled="loading">Filtrer</button>
        </div>
      </div>

      <p class="muted" style="margin-top:.75rem">
        Évolution des performances séance par séance.
      </p>
    </div>

    <div class="card" style="margin-top:1rem;">
      <h3 style="margin:0 0 .35rem 0;">Coach référent</h3>
      <p class="muted" style="margin:0;">
        {{ coachLabel }}
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
      <div v-if="globalInsight" class="grid grid-3" style="margin-top:1rem;">
        <div class="card">
          <h4>Prévision cardiaque globale</h4>
          <p class="muted">
            FC prévue moyenne :
            <strong>{{ globalInsight.avgScore.toFixed(1) }} bpm</strong>
          </p>
        </div>

        <div class="card">
          <h4>Indicateurs calculés</h4>
          <ul class="muted">
            <li>Charge : {{ globalInsight.load.toFixed(1) }}</li>
            <li>Intensité : {{ globalInsight.intensity.toFixed(1) }}</li>
          </ul>
        </div>

        <div class="card">
          <h4>Récupération</h4>
          <p class="muted">{{ globalInsight.recovery.toFixed(1) }}</p>
          <p class="muted">
            <em>
              {{
                globalInsight.intensity > globalInsight.recovery
                  ? 'Attention à la récupération'
                  : 'Profil équilibré'
              }}
            </em>
          </p>
        </div>
      </div>


      <div class="card" style="margin-top:1rem;">
        <label>Métrique affichée</label>
        <select v-model="metric">
          <option value="forecastHr">FC prévue prochaine séance</option>
          <option value="distanceKm">Distance (km)</option>
          <option value="hrAvg">FC moyenne</option>
          <option value="stress">Stress</option>
        </select>
      </div>

      <MetricLineChart v-if="sessions.length" :sessions="sessions" :metric="metric" :metrics="METRICS" />

      <div class="card" style="margin-top:1rem;" v-if="globalGpsPoints.length">
        <h3 style="margin:0 0 .5rem 0;">Tracés GPS cumulés</h3>
        <GpsMap :points="globalGpsPoints" />
      </div>

      <div class="card" style="margin-top:1rem;">
        <h3>Prévision cardiaque XGBoost</h3>
        <p class="muted">
          Le modèle prévoit en bpm la fréquence cardiaque moyenne de la prochaine séance de charge comparable.
          La cible est une mesure réellement observée, pas un score construit. Lorsqu'une séance comparable
          est réalisée, l'application enregistre la FC réelle et l'erreur de la prévision.
        </p>
        <p class="muted">
          Les séances de moins de 5 minutes ou sans distance, pas ou cardio exploitables ne reçoivent aucune
          prévision. La validation compare XGBoost à une baseline simple qui reconduit la FC actuelle.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

import { useModuleStore } from '../store/module.store'
import { useSessionStore } from '../store/session.store'
import { useAuthStore } from '../store/auth.store'

import StatCard from '../components/StatCard.vue'
import GpsMap from '../components/GpsMap.vue'
import MetricLineChart from '../components/MetricLineChart.vue'

const router = useRouter()
const moduleStore = useModuleStore()
const sessionStore = useSessionStore()
const auth = useAuthStore()

const days = ref(7)
const loading = ref(false)
const sessions = ref([])
const globalGpsPoints = ref([])
const metric = ref('forecastHr')

const METRICS = {
  forecastHr: {
    label: 'FC prévue prochaine séance (bpm)',
    get: s => s.forecastHr,
    min: 60,
    max: 200
  },
  distanceKm: {
    label: 'Distance (km)',
    get: s => s.distanceKm,
    min: 0
  },
  hrAvg: {
    label: 'FC moyenne (bpm)',
    get: s => s.hrAvg,
    min: 60,
    max: 200
  },
  stress: {
    label: 'Stress',
    get: s => s.stress,
    min: 0,
    max: 100
  }
}

onMounted(async () => {
  await moduleStore.fetch()
  await reload()
})

async function reload() {
  loading.value = true
  try {
    let list = await sessionStore.fetchHistory()

    const minDate = Date.now() - days.value * 24 * 3600 * 1000
    list = list
      .filter(s => new Date(s.startDate).getTime() >= minDate)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))


    sessions.value = list.map(s => ({
      sessionMongoId: s._id,
      start: s.startDate,
      stats: s.stats,
      distanceKm: s.stats?.distanceKm,
      hrAvg: s.stats?.hrAvg,
      hrMax: s.stats?.hrMax,
      steps: s.stats?.steps,
      stress: s.stats?.stress,

      forecastHr: s.stats?.aiPrediction?.target === 'next_comparable_session_hr_avg'
        ? s.stats.aiPrediction.predictedHrAvg
        : null,
    }))



    globalGpsPoints.value = []
  } finally {
    loading.value = false
  }
}

const chartData = computed(() => ({
  labels: sessions.value.map(s => new Date(s.start).toLocaleString()),
  datasets: [{
    data: sessions.value.map(s => s.forecastHr ?? null),
    borderColor: '#6ee7ff',
    backgroundColor: 'rgba(110,231,255,.25)',
    tension: 0.3,
  }]
}))

const totalDistanceLabel = computed(() =>
  `${sessions.value.reduce((a, s) => a + (s.distanceKm ?? 0), 0).toFixed(2)} km`
)
const hrAvgLabel = computed(() => {
  const v = sessions.value.map(s => s.hrAvg).filter(Boolean)
  return v.length ? `${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} bpm` : '—'
})
const hrMaxLabel = computed(() => {
  const v = sessions.value.map(s => s.hrMax).filter(Boolean)
  return v.length ? `${Math.max(...v)} bpm` : '—'
})
const stepsTotalLabel = computed(() =>
  `${sessions.value.reduce((a, s) => a + (s.steps ?? 0), 0)}`
)
const stressAvgLabel = computed(() => {
  const v = sessions.value.map(s => s.stress).filter(Boolean)
  return v.length ? `${Math.round(v.reduce((a, b) => a + b, 0) / v.length)}/100` : '—'
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { precision: 0 }
    }
  },
  onClick: (evt, elements) => {
    if (!elements.length) return

    const idx = elements[0].index
    const session = sessions.value[idx]

    if (session?.sessionMongoId) {
      router.push(`/sessions/${session.sessionMongoId}`)
    }
  }
}
const globalInsight = computed(() => {
  const list = sessions.value.filter(
    s => s.stats?.score?.components && Number.isFinite(s.forecastHr)
  )

  if (!list.length) return null

  let avgScore = 0
  let load = 0
  let intensity = 0
  let recovery = 0

  for (const s of list) {
    const c = s.stats.score.components
    avgScore += s.forecastHr
    load += c.load
    intensity += c.intensity
    recovery += c.recovery
  }

  const n = list.length

  return {
    avgScore: avgScore / n,
    load: load / n,
    intensity: intensity / n,
    recovery: recovery / n
  }
})

const coachLabel = computed(() => {
  if (!auth.coach) return 'Aucun coach attribué pour le moment.'
  return `Votre coach : ${auth.coach.login || '—'}`
})
</script>
