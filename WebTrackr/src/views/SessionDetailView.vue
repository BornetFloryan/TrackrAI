<template>
  <div class="page">
    <h1>Détail séance</h1>

    <div class="card" v-if="loading">Chargement…</div>

    <template v-else>
      <div class="grid grid-3">
        <StatCard title="Durée" :value="durationLabel" />
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
import { buildGpsTrack, measuresOf } from '../utils/measureAdapters'
import { haversineKm } from '../utils/geo'
import { estimateSteps, estimateStress } from '../utils/physio'

import StatCard from '../components/StatCard.vue'
import MeasureChart from '../components/MeasureChart.vue'
import GpsMap from '../components/GpsMap.vue'

const props = defineProps({
  sessionMongoId: { type: String, required: true }
})

const measureStore = useMeasureStore()
const loading = ref(false)
const measures = ref([])

const gpsPoints = ref([])

onMounted(async () => {
  loading.value = true
  try {
    // On ne peut pas filtrer serveur par session -> on prend 30 jours et on filtre client.
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

const distanceKm = computed(() => {
  if (gpsPoints.value.length < 2) return 0
  let d = 0
  for (let i = 1; i < gpsPoints.value.length; i++) d += haversineKm(gpsPoints.value[i - 1], gpsPoints.value[i])
  return d
})
const distanceLabel = computed(() => `${distanceKm.value.toFixed(2)} km`)

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

const steps = computed(() => {
  const ax = measuresOf(measures.value, 'acc_x')
  const ay = measuresOf(measures.value, 'acc_y')
  const az = measuresOf(measures.value, 'acc_z')
  return estimateSteps(ax, ay, az)
})

const stress = computed(() => {
  const hrAvg = hrSeries.value.length ? hrSeries.value.reduce((a, b) => a + (b.value > 0 ? b.value : 0), 0) / Math.max(1, hrSeries.value.filter(x => x.value > 0).length) : null
  // rmssd dernier
  let rmssd = null
  for (let i = measures.value.length - 1; i >= 0; i--) {
    if (measures.value[i].type === 'rmssd') {
      const n = Number(measures.value[i].value); if (Number.isFinite(n)) rmssd = n
      break
    }
  }
  return estimateStress({ rmssd, hr: hrAvg })
})

const stressLabel = computed(() => stress.value ?? '—')
const stressSub = computed(() => `Pas estimés: ${steps.value}`)
</script>
