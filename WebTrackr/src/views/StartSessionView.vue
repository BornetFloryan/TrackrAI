<template>
  <div class="page">
    <h1>Nouvelle séance</h1>

    <div class="card">
      <label>Module</label>

      <select v-model="moduleKey" :disabled="sessionStore.loading || moduleStoreLoading">
        <option disabled value="">
          {{ moduleStoreLoading ? 'Chargement...' : 'Sélectionner un module' }}
        </option>
        <option v-for="m in modules" :key="m._id" :value="m.key" :disabled="!m.connected">
          {{ m.name }} ({{ m.uc }}) {{ m.connected ? '🟢' : '⚪' }}
        </option>

      </select>

      <div style="display:flex; gap:.5rem; margin-top:.75rem; flex-wrap:wrap;">
        <button @click="startSession" :disabled="!moduleKey || sessionStore.loading || !!sessionStore.sessionId">
          Démarrer
        </button>
        <button class="secondary" @click="stopSession" :disabled="sessionStore.loading || !sessionStore.sessionId">
          Arrêter
        </button>
        <button class="secondary" @click="refreshNow" :disabled="!moduleKey || sessionStore.loading">
          Rafraîchir
        </button>
      </div>

      <p style="color:var(--muted); margin-top:.5rem" v-if="sessionStore.sessionId">
        Session active : <strong>{{ sessionStore.sessionId }}</strong>
      </p>
      <p style="color:var(--danger)" v-if="errorMsg">{{ errorMsg }}</p>
    </div>

    <div class="grid grid-3" style="margin-top:1rem;">
      <Gauge label="BPM (live)" :value="lastHrValue" unit="bpm" :min="40" :max="200" :hint="hrHint" />
      <Gauge label="Stress" :value="stressValue ?? '--'" unit="/100" :min="0" :max="100" :hint="stressHint" />
      <Gauge label="Pas (estimés)" :value="stepsValue" unit="pas" :min="0" :max="5000" :hint="stepsHint" />
    </div>

    <div class="grid grid-3" style="margin-top:1rem;">
      <StatCard title="Temps" :value="elapsedLabel" :sub="sessionStore.sessionId ? 'En cours' : '—'" />
      <StatCard title="Distance" :value="distanceKmLabel" :sub="speedKmHLabel" />
      <Compass :heading="headingDeg" :sub="headingSub" />
    </div>

    <div class="card" style="margin-top:1rem;">
      <h3 style="margin-top:0">Carte</h3>
      <GpsMap :points="gpsPoints" />
      <div style="display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.6rem;">
        <span class="badge">📍 Points GPS: {{ gpsPoints.length }}</span>
        <span class="badge" v-if="lastGpsLabel">Dernier: {{ lastGpsLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

import { useModuleStore } from '../store/module.store'
import { useSessionStore } from '../store/session.store'
import { useMeasureStore } from '../store/measure.store'

import StatCard from '../components/StatCard.vue'
import Gauge from '../components/Gauge.vue'
import Compass from '../components/Compass.vue'
import GpsMap from '../components/GpsMap.vue'

import { buildGpsTrack, lastValue, measuresOf } from '../utils/measureAdapters'
import { haversineKm, bearingDeg } from '../utils/geo'
import { estimateSteps, estimateStress } from '../utils/physio'

const moduleStore = useModuleStore()
const sessionStore = useSessionStore()
const measureStore = useMeasureStore()
const { modules } = storeToRefs(moduleStore)

const moduleStoreLoading = ref(false)
const errorMsg = ref('')

const moduleKey = ref('')

const gpsPoints = ref([])
const elapsedMs = ref(0)

const lastHr = ref(null)
const lastRmssd = ref(null)
const lastSpeed = ref(null)

const headingDeg = ref(null)
const lastGpsLabel = ref('')

const stepsValue = ref(0)
const stressValue = ref(null)

let poller = null
let timer = null
let startedAt = null
let modulePoller = null
let sessionPoller = null

onMounted(async () => {
  moduleStoreLoading.value = true
  try {
    await moduleStore.fetch()
    autoSelectConnectedModule()
    startModulePolling()
  } catch (e) {
    errorMsg.value = 'Impossible de charger les modules'
  } finally {
    moduleStoreLoading.value = false
  }
})

async function startSession() {
  errorMsg.value = ''
  try {
    await sessionStore.start(moduleKey.value)
    startedAt = Date.now()
    startTimer()
    startPolling()
    startSessionPolling()
  } catch (e) {
    errorMsg.value = sessionStore.error?.data || sessionStore.error?.message || 'Erreur démarrage session'
  }
}

async function stopSession() {
  errorMsg.value = ''
  try {
    await sessionStore.stop()
  } catch (e) {
    errorMsg.value = sessionStore.error?.data || sessionStore.error?.message || 'Erreur arrêt session'
  } finally {
    stopPolling()
    stopTimer()
    stopSessionPolling()
  }
}

async function refreshNow() {
  await fetchMeasures()
}

function dedupeGps(points, minMoveMeters = 1.5) {
  if (points.length < 2) return points
  const out = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const a = out[out.length - 1]
    const b = points[i]
    const dKm = haversineKm(a, b)
    const dM = dKm * 1000
    if (dM >= minMoveMeters) out.push(b)
  }
  return out
}

async function fetchMeasures() {
  if (!moduleKey.value) return

  const list = await measureStore.fetch(moduleKey.value)

  lastHr.value = lastValue(list, 'heart_rate')
  lastRmssd.value = lastValue(list, 'rmssd')
  lastSpeed.value = lastValue(list, 'gps_speed')

  const track = buildGpsTrack(list)
  const rawPoints = track.map(p => [p.lat, p.lon])

  gpsPoints.value = dedupeGps(rawPoints, 1.5)

  if (rawPoints.length) {
    const [lat, lon] = rawPoints[rawPoints.length - 1]
    lastGpsLabel.value = `${lat.toFixed(5)}, ${lon.toFixed(5)}`
  } else {
    lastGpsLabel.value = ''
  }

  if (gpsPoints.value.length >= 2) {
    const a = gpsPoints.value[gpsPoints.value.length - 2]
    const b = gpsPoints.value[gpsPoints.value.length - 1]
    headingDeg.value = bearingDeg(a, b)
  } else {
    headingDeg.value = null
  }

  const ax = measuresOf(list, 'acc_x')
  const ay = measuresOf(list, 'acc_y')
  const az = measuresOf(list, 'acc_z')
  stepsValue.value = estimateSteps(ax, ay, az)

  console.log("rmssd : ", lastRmssd.value, ", hr : ", lastHr.value)
  stressValue.value = estimateStress({ rmssd: lastRmssd.value, hr: lastHr.value })
}

function startPolling() {
  stopPolling()
  fetchMeasures()
  poller = setInterval(fetchMeasures, 1500)
}
function stopPolling() {
  if (poller) clearInterval(poller)
  poller = null
}

function startModulePolling() {
  stopModulePolling()
  modulePoller = setInterval(async () => {
    await moduleStore.fetch({ silent: true })
    autoSelectConnectedModule()
  }, 2000)
}

function stopModulePolling() {
  if (typeof modulePoller !== 'undefined' && modulePoller) {
    clearInterval(modulePoller)
    modulePoller = null
  }
}

function autoSelectConnectedModule() {
  if (sessionStore.sessionId) return

  const current = modules.value.find(m => m.key === moduleKey.value)
  if (!moduleKey.value || (current && !current.connected)) {
    const active = modules.value.find(m => m.connected)
    moduleKey.value = active ? active.key : ''
  }
}

function startSessionPolling() {
  stopSessionPolling()
  sessionPoller = setInterval(async () => {
    if (!moduleKey.value || !sessionStore.sessionId) return

    const res = await sessionStore.syncActiveForModule(moduleKey.value)
    if (!res?.active) {
      stopPolling()
      stopTimer()
    }
  }, 2000)
}

function stopSessionPolling() {
  if (sessionPoller) clearInterval(sessionPoller)
  sessionPoller = null
}


function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    elapsedMs.value = Date.now() - startedAt
  }, 500)
}
function stopTimer() {
  if (timer) clearInterval(timer)
  timer = null
  elapsedMs.value = 0
}

onBeforeUnmount(() => {
  stopModulePolling()
  stopPolling()
  stopTimer()
  stopSessionPolling()
})

const elapsedLabel = computed(() => {
  const s = Math.floor(elapsedMs.value / 1000)
  const mm = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

const lastHrValue = computed(() => {
  if (!Number.isFinite(lastHr.value) || lastHr.value <= 0) return '--'
  return Math.round(lastHr.value)
})

const hrHint = computed(() => {
  if (lastHrValue.value === '--') return 'Capteur non connecté'
  if (lastHrValue.value < 90) return 'Zone facile'
  if (lastHrValue.value < 140) return 'Zone modérée'
  return 'Zone intense'
})

const distanceKm = computed(() => {
  if (gpsPoints.value.length < 2) return 0
  let d = 0
  for (let i = 1; i < gpsPoints.value.length; i++) {
    d += haversineKm(gpsPoints.value[i - 1], gpsPoints.value[i])
  }
  return d
})

const distanceKmLabel = computed(() => `${distanceKm.value.toFixed(2)} km`)

const speedKmHLabel = computed(() => {
  const v = lastSpeed.value
  if (!Number.isFinite(v)) return 'Vitesse: —'
  const kmh = v * 3.6
  return `Vitesse: ${kmh.toFixed(1)} km/h`
})

const stepsHint = computed(() => sessionStore.sessionId ? 'Accéléromètre (pics)' : '—')
const stressHint = computed(() => {
  if (Number.isFinite(lastRmssd.value) && lastRmssd.value > 0) return 'Basé RMSSD'
  if (Number.isFinite(lastHr.value) && lastHr.value > 0) return 'Basé HR'
  return '—'
})

const headingSub = computed(() => {
  if (headingDeg.value == null) return 'Direction: immobile / GPS insuffisant'
  return 'Direction de déplacement (GPS)'
})

watch(
  () => modules.value,
  (mods) => {
    if (!sessionStore.sessionId) return

    const current = mods.find(m => m.key === moduleKey.value)
    if (current && !current.connected) {
      errorMsg.value = 'Module déconnecté — session arrêtée'
      sessionStore.sessionId = null
      stopPolling()
      stopTimer()
    }

  },
  { deep: true }
)
</script>
