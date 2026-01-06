<template>
  <div class="page">
    <h1>Détail séance</h1>

    <div class="card" v-if="loading">Chargement…</div>

    <template v-else>
      <div class="grid grid-3">
        <StatCard title="Durée" :value="durationLabel" :sub="dureeSub" />
        <StatCard title="Distance" :value="distanceLabel" :sub="speedLabel" />
        <StatCard title="Stress" :value="stressLabel" :sub="stressSub" />
      </div>

      <div class="grid grid-2" style="margin-top:1rem;">
        <MeasureChart title="Fréquence cardiaque" type="heart_rate" unit="bpm" :series="hrSeries" />
        <MeasureChart title="Vitesse" type="gps_speed" unit="km/h" :series="speedSeriesKmH" />
      </div>

      <div class="card" style="margin-top:1rem;">
        <h3 style="margin:0 0 .5rem 0;">Trace GPS</h3>
        <GpsMap :points="gpsPoints" />
      </div>

      <div class="card" style="margin-top:1rem;" v-if="stats?.score">
        <h3 style="margin:0 0 .5rem 0;">Analyse IA de la séance</h3>

        <p class="muted">
          Score global calculé automatiquement à partir des données physiologiques.
        </p>

        <div class="grid grid-3" style="margin-top:.5rem;">
          <StatCard title="Score global" :value="stats.score.global?.toFixed(1) ?? '—'"
            :sub="`Confiance: ${(stats.score.confidence * 100).toFixed(0)} %`" />

          <StatCard title="Charge" :value="stats.score.components.load" sub="Distance / durée" />

          <StatCard title="Intensité" :value="stats.score.components.intensity" sub="Fréquence cardiaque" />
        </div>

        <div class="grid grid-2" style="margin-top:.75rem;">
          <StatCard title="Récupération" :value="stats.score.components.recovery" sub="Stress physiologique" />

          <StatCard title="Analyse IA" value="XGBoost (régression)"
            :sub="`Entraînée sur score physiologique pondéré`" />

        </div>

        <p class="muted" style="margin-top:.75rem;">
          Pondérations utilisées :
          Charge {{ stats.score.weights.wLoad * 100 }} %,
          Intensité {{ stats.score.weights.wIntensity * 100 }} %,
          Récupération {{ stats.score.weights.wRecovery * 100 }} %.
        </p>
      </div>


      <div class="card" style="margin-top:1rem;">
        <h3 style="margin:0 0 .5rem 0;">Mesures brutes</h3>
        <p style="color:var(--muted); margin:0 0 .75rem 0;">
          Nombre de mesures : {{ measures.length }}
        </p>
        <div
          style="max-height:320px; overflow:auto; border:1px solid var(--border); border-radius:12px; padding:.6rem;">
          <div v-for="m in measures.slice().reverse().slice(0, 200)" :key="m._id"
            style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.85rem; color:rgba(231,238,252,.85)">
            {{ new Date(m.date).toLocaleTimeString() }} • {{ m.type }} = {{ m.value }}
          </div>
        </div>
        <p style="color:var(--muted); margin:.6rem 0 0 0">Affichage limité aux 200 dernières lignes.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMeasureStore } from '../store/measure.store'
import { useSessionStore } from '../store/session.store'
import { buildGpsTrack, measuresOf } from '../utils/measureAdapters'
import { estimateStress } from '../utils/physio'

import StatCard from '../components/StatCard.vue'
import MeasureChart from '../components/MeasureChart.vue'
import GpsMap from '../components/GpsMap.vue'

const props = defineProps({
  sessionMongoId: { type: String, required: true }
})

const measureStore = useMeasureStore()
const sessionStore = useSessionStore()
const loading = ref(false)
const measures = ref([])

const gpsPoints = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const after = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    const all = await measureStore.fetch(null, after, null)
    measures.value = all.filter(m => String(m.session) === String(props.sessionMongoId))
    measures.value.sort((a, b) => new Date(a.date) - new Date(b.date))

    const track = buildGpsTrack(measures.value)
    gpsPoints.value = track.map(p => [p.lat, p.lon])
  } finally {
    loading.value = false
  }
})

const session = computed(() =>
  sessionStore.history.find(s => s._id === props.sessionMongoId)
)

const stats = computed(() => session.value?.stats ?? null)

const durationMs = computed(() => {
  if (!measures.value.length) return 0
  const a = new Date(measures.value[0].date).getTime()
  const b = new Date(measures.value[measures.value.length - 1].date).getTime()
  return Math.max(0, b - a)
})
const durationLabel = computed(() => {
  const s = Math.floor(durationMs.value / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}m ${r}s`
})

const distanceLabel = computed(() =>
  stats.value ? `${stats.value.distanceKm.toFixed(2)} km` : '—'
)

const hrSeries = computed(() => measuresOf(measures.value, 'heart_rate').map(p => ({ date: new Date(p.date), value: p.value })))

const speedSeriesKmH = computed(() =>
  measuresOf(measures.value, 'gps_speed')
    .map(p => ({ date: new Date(p.date), value: p.value * 3.6 }))
)

const speedLabel = computed(() => {
  const arr = speedSeriesKmH.value.map(x => x.value)
  if (!arr.length) return 'Vitesse: —'
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  return `Vitesse moy.: ${avg.toFixed(1)} km/h`
})

const stress = computed(() => {
  const hrAvg = hrSeries.value.length ? hrSeries.value.reduce((a, b) => a + (b.value > 0 ? b.value : 0), 0) / Math.max(1, hrSeries.value.filter(x => x.value > 0).length) : null
  let rmssd = null
  for (let i = measures.value.length - 1; i >= 0; i--) {
    if (measures.value[i].type === 'rmssd') {
      const n = Number(measures.value[i].value); if (Number.isFinite(n)) rmssd = n
      break
    }
  }
  return estimateStress({ rmssd, hr: hrAvg })
})

const stressLabel = computed(() =>
  stats.value?.stress ?? '—'
)

const weightLabel = computed(() => {
  if (!stats.value?.score?.weights) return '—'
  const w = stats.value.score.weights
  return `${w.wLoad * 100}% / ${w.wIntensity * 100}% / ${w.wRecovery * 100}%`
})

const stressSub = computed(() =>
  stats.value.steps ? `Pas estimés: ${stats.value.steps}` : ''
)

const dureeSub = computed(() =>
  stats.value.score.global ? `Score: ${stats.value.score.global.toFixed(2)}` : ''
)

</script>
