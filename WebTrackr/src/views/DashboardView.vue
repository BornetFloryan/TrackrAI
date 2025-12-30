<template>
  <div class="page">
    <h1>Dashboard</h1>

    <!-- ===== FILTRES ===== -->
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
          <button @click="reload" :disabled="loading">Analyser</button>
        </div>
      </div>

      <p class="muted" style="margin-top:.75rem">
        Évolution des performances séance par séance.
      </p>
    </div>

    <!-- ===== LOADING ===== -->
    <div v-if="loading" class="card" style="margin-top:1rem;">
      Chargement…
    </div>

    <template v-else>

      <!-- ===== STATS GLOBALES ===== -->
      <div class="grid grid-3" style="margin-top:1rem;">
        <StatCard title="Distance totale" :value="totalDistanceLabel" />
        <StatCard title="HR moyenne" :value="hrAvgLabel" :sub="`HR max: ${hrMaxLabel}`" />
        <StatCard title="Stress moyen" :value="stressAvgLabel" :sub="`Pas totaux: ${stepsTotalLabel}`" />
      </div>

      <!-- ===== GRAPH PERFORMANCE ===== -->
      <div class="card" style="margin-top:1rem;">
        <h3 style="margin:0 0 .5rem 0;">Performance des séances</h3>

        <Line v-if="chartData.datasets[0].data.length" :data="chartData" :options="chartOptions" />

        <p v-else style="color:var(--muted)">Aucune séance sur la période.</p>
      </div>

      <!-- ===== CARTE GPS GLOBALE ===== -->
      <div class="card" style="margin-top:1rem;" v-if="globalGpsPoints.length">
        <h3 style="margin:0 0 .5rem 0;">Tracés GPS cumulés</h3>
        <GpsMap :points="globalGpsPoints" />
      </div>

      <!-- ===== IA READY ===== -->
      <div class="card" style="margin-top:1rem;">
        <h3>Analyse IA (préparée)</h3>
        <ul class="muted">
          <li>Charge d’entraînement</li>
          <li>Tendance de performance</li>
          <li>Détection fatigue / surmenage</li>
          <li>Comparaison inter-séances</li>
        </ul>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip
} from 'chart.js'

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip
)

import { useModuleStore } from '../store/module.store'
import { useMeasureStore } from '../store/measure.store'
import { groupSessionsFromMeasures } from '../utils/sessionsFromMeasures'

import StatCard from '../components/StatCard.vue'
import GpsMap from '../components/GpsMap.vue'

/* ================= STORES ================= */
const router = useRouter()
const moduleStore = useModuleStore()
const measureStore = useMeasureStore()
const { modules } = storeToRefs(moduleStore)

/* ================= STATE ================= */
const days = ref(7)
const moduleKey = ref('')
const loading = ref(false)

const sessions = ref([])
const globalGpsPoints = ref([])

/* ================= LABELS ================= */
const sessionLabels = computed(() =>
  sessions.value.map((s, i) => {
    const d = new Date(s.start)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
  })
)

/* ================= INIT ================= */
onMounted(async () => {
  await moduleStore.fetch()
  await reload()
})

/* ================= ACTIONS ================= */
async function reload() {
  loading.value = true
  try {
    const after = new Date(Date.now() - days.value * 24 * 3600 * 1000).toISOString()
    const measures = await measureStore.fetch(null, after, null)

    let list = groupSessionsFromMeasures(measures)

    // filtre module (clé fonctionnelle, comme HistoriqueView)
    if (moduleKey.value) {
      list = list.filter(s => s.moduleKey === moduleKey.value)
    }

    // ordre chronologique
    list.sort((a, b) => new Date(a.start) - new Date(b.start))

    list = list.filter(s =>
      s.distanceKm > 0 ||
      s.hrAvg != null ||
      s.steps > 0
    )


    sessions.value = list
    globalGpsPoints.value = list.flatMap(s => s.gpsTrack ?? [])
  } finally {
    loading.value = false
  }
}

/* ================= SCORE ================= */
function performanceScore(s) {
  return Math.round(
    (s.distanceKm ?? 0) * 10 +
    ((s.speedAvgMs ?? 0) * 3.6) * 5 +
    (s.hrAvg ?? 0) * 0.2 -
    (s.stress ?? 0) * 0.5
  )
}

/* ================= GRAPH ================= */
const chartData = computed(() => ({
  labels: sessionLabels.value,
  datasets: [{
    label: 'Score de performance',
    data: sessions.value.map(s => performanceScore(s)),
    customData: sessions.value.map(s => ({
      sessionId: s.sessionMongoId,
      start: s.start,
      distance: s.distanceKm,
      hrAvg: s.hrAvg,
      stress: s.stress,
    })),
    borderColor: '#6ee7ff',
    backgroundColor: 'rgba(110,231,255,.25)',
    pointRadius: 6,
    pointHoverRadius: 9,
    tension: 0.3,
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      intersect: false,
      mode: 'nearest',
      axis: 'x',
      callbacks: {
        title(ctx) {
          return new Date(
            ctx[0].dataset.customData[ctx[0].dataIndex].start
          ).toLocaleString()
        },
        label(ctx) {
          const p = ctx.dataset.customData[ctx.dataIndex]
          return [
            `Score : ${ctx.parsed.y}`,
            `Distance : ${p.distance?.toFixed(2) ?? '—'} km`,
            `HR moy : ${p.hrAvg ?? '—'} bpm`,
            `Stress : ${p.stress ?? '—'}`
          ]
        }
      }
    }
  },
  onClick(_, elements) {
    if (!elements.length) return
    const p = chartData.value.datasets[0].customData[elements[0].index]
    router.push({
      name: 'session-detail',
      params: { sessionMongoId: p.sessionId }
    })
  },
  scales: {
    x: {
      ticks: { color: '#9fb0d0', maxRotation: 45 },
      grid: { color: 'rgba(255,255,255,.04)' }
    },
    y: {
      ticks: { color: '#9fb0d0' },
      grid: { color: 'rgba(255,255,255,.04)' }
    }
  }
}

/* ================= STATS ================= */
const totalDistanceLabel = computed(() =>
  `${sessions.value.reduce((a, s) => a + (s.distanceKm ?? 0), 0).toFixed(2)} km`
)

const hrAvgLabel = computed(() => {
  const v = sessions.value.map(s => s.hrAvg).filter(v => v != null)
  return v.length ? `${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} bpm` : '—'
})

const hrMaxLabel = computed(() => {
  const v = sessions.value.map(s => s.hrMax).filter(v => v != null)
  return v.length ? `${Math.max(...v)} bpm` : '—'
})

const stepsTotalLabel = computed(() =>
  `${sessions.value.reduce((a, s) => a + (s.steps ?? 0), 0)}`
)

const stressAvgLabel = computed(() => {
  const v = sessions.value.map(s => s.stress).filter(v => v != null)
  return v.length ? `${Math.round(v.reduce((a, b) => a + b, 0) / v.length)}/100` : '—'
})
</script>

<style scoped>
canvas {
  height: 320px !important;
}
</style>
