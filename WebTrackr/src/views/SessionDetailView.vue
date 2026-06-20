<template>
  <div class="page">
    <h1>Détail séance</h1>
    <div class="card" style="margin-bottom:1rem; display:flex; justify-content:flex-start;">
      <button class="secondary" @click="goBack">
        ← Retour
      </button>
    </div>


    <div class="card" v-if="loading">Chargement…</div>

    <template v-else>
      <div v-if="isLiveSession" class="card live-card">
        <strong>Séance en direct</strong>
        <span class="muted">Les mesures sont rafraîchies automatiquement toutes les 5 secondes.</span>
      </div>
      <div class="grid grid-3">
        <StatCard title="Durée" :value="durationLabel" :sub="dureeSub" />
        <StatCard title="Distance" :value="distanceLabel" :sub="gpsQualityLabel" />
        <StatCard title="Stress" :value="stressLabel" :sub="stressSub" />
      </div>

      <div class="grid grid-2" style="margin-top:1rem;">
        <MeasureChart title="Fréquence cardiaque" type="heart_rate" unit="bpm" :series="hrSeries" />
        <MeasureChart title="Vitesse" type="gps_speed" unit="km/h" :series="speedSeriesKmH" />
      </div>

      <div class="card" style="margin-top:1rem;">
        <h3 style="margin:0 0 .5rem 0;">Trace GPS</h3>
        <p class="muted" style="margin-top:0;">
          {{ gpsQualityLabel }}
        </p>
        <GpsMap :points="gpsPoints" />
      </div>

      <div class="card" style="margin-top:1rem;" v-if="stats?.score?.components">
        <h3 style="margin:0 0 .5rem 0;">Indicateurs calculés de la séance</h3>
        <p class="muted">
          Ces indicateurs sont calculés directement à partir des mesures. Ils ne sont pas produits par XGBoost.
        </p>
        <div class="grid grid-3" style="margin-top:.5rem;">
          <StatCard title="Charge" :value="stats.score.components.load" sub="Distance / durée" />
          <StatCard title="Intensité" :value="stats.score.components.intensity" sub="Fréquence cardiaque" />
          <StatCard title="Récupération" :value="stats.score.components.recovery" sub="Stress physiologique" />
        </div>
      </div>

      <div class="card" style="margin-top:1rem;" v-if="aiInsights?.prediction">
        <h3 style="margin:0 0 .5rem 0;">Prévision cardiaque XGBoost</h3>
        <p class="muted">
          Le modèle prévoit la fréquence cardiaque moyenne de la prochaine séance de charge comparable.
          Cette valeur pourra être confrontée à la mesure réelle lors de cette prochaine séance.
        </p>
        <div class="grid grid-3" style="margin-top:.5rem;">
          <StatCard title="FC prévue" :value="formatBpm(aiInsights.prediction.predictedNextHrAvg)"
            sub="Prochaine séance comparable" />
          <StatCard title="Écart prévu" :value="formatSignedBpm(aiInsights.prediction.deltaBpm)"
            :sub="'FC actuelle : ' + Math.round(aiInsights.prediction.currentHrAvg) + ' bpm'" />
          <StatCard title="Erreur de validation" :value="modelMaeLabel"
            :sub="modelQualityLabel" />
        </div>

        <p v-if="aiInsights.prediction.expectedRange" class="muted" style="margin-top:.75rem;">
          Plage indicative fondée sur la MAE de validation :
          {{ aiInsights.prediction.expectedRange.min }} à {{ aiInsights.prediction.expectedRange.max }} bpm.
        </p>

        <div v-if="aiInsights.prediction.evaluation" class="evaluation-box">
          <strong>Prévision vérifiée</strong>
          <span>FC réellement observée : {{ aiInsights.prediction.evaluation.actualHrAvg }} bpm</span>
          <span>Erreur absolue : {{ aiInsights.prediction.evaluation.absoluteErrorBpm }} bpm</span>
        </div>

        <div v-if="aiInsights.recommendation" class="ai-recommendation">
          <h4>Aide à la décision pour la prochaine séance</h4>
          <p class="recommendation-summary">{{ aiInsights.recommendation.summary }}</p>
          <div class="recommendation-grid">
            <div>
              <span class="muted">Intensité</span>
              <strong>{{ aiInsights.recommendation.nextSession.intensity }}</strong>
            </div>
            <div>
              <span class="muted">Durée cible</span>
              <strong>{{ formatTarget(aiInsights.recommendation.nextSession.durationMin, 'min') }}</strong>
            </div>
            <div>
              <span class="muted">Distance cible</span>
              <strong>{{ formatTarget(aiInsights.recommendation.nextSession.distanceKm, 'km') }}</strong>
            </div>
            <div>
              <span class="muted">Pas cible</span>
              <strong>{{ formatTarget(aiInsights.recommendation.nextSession.steps, 'pas') }}</strong>
            </div>
          </div>
          <p class="muted" style="margin:.75rem 0 .35rem 0;">
            Objectif : {{ aiInsights.recommendation.nextSession.focus }}.
          </p>
          <ul class="insight-list">
            <li v-for="reason in aiInsights.recommendation.reasons" :key="reason">{{ reason }}</li>
          </ul>
          <ul v-if="aiInsights.recommendation.warnings?.length" class="insight-list warning-list">
            <li v-for="warning in aiInsights.recommendation.warnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </div>
      <div class="card" style="margin-top:1rem;" v-else-if="!isLiveSession">
        <h3 style="margin:0 0 .5rem 0;">Indice IA indisponible</h3>
        <p class="muted" style="margin:0;">{{ aiAvailabilityLabel }}</p>
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMeasureStore } from '../store/measure.store'
import { useSessionStore } from '../store/session.store'
import { buildGpsTrack, measuresOf } from '../utils/measureAdapters'
import { estimateStress } from '../utils/physio'
import { getSessionInsights } from '../services/ai.service'
import { getSessionSteps } from '../utils/steps'

import GpsMap from '../components/GpsMap.vue'
import MeasureChart from '../components/MeasureChart.vue'
import StatCard from '../components/StatCard.vue'

const router = useRouter()

const props = defineProps({
  sessionMongoId: { type: String, required: true }
})

const measureStore = useMeasureStore()
const sessionStore = useSessionStore()
const loading = ref(false)
const measures = ref([])
const aiInsights = ref(null)
let livePoller = null

const gpsPoints = ref([])

async function loadMeasures() {
  const after = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const all = await measureStore.fetch(null, after, null)
  measures.value = all.filter(m => String(m.session) === String(props.sessionMongoId))
  measures.value.sort((a, b) => new Date(a.date) - new Date(b.date))

  const track = buildGpsTrack(measures.value)
  gpsPoints.value = track.map(p => [p.lat, p.lon])
}


async function loadAiInsights() {
  aiInsights.value = null
  if (!session.value?.sessionId) return

  try {
    const res = await getSessionInsights(session.value.sessionId)
    aiInsights.value = res.data?.data || null
  } catch (_) {
    aiInsights.value = null
  }
}
const aiAvailabilityLabel = computed(() => {
  const reasons = aiInsights.value?.availability?.qualityReasons || []
  if (reasons.includes('session_too_short')) {
    return 'Séance trop courte : au moins 5 minutes sont nécessaires.'
  }
  if (reasons.includes('insufficient_load_data')) {
    return 'Charge insuffisante : aucune distance exploitable et moins de 100 pas.'
  }
  if (reasons.includes('missing_heart_rate')) {
    return 'Fréquence cardiaque insuffisante pour calculer une prédiction.'
  }
  return 'Cette séance ne dispose pas des données nécessaires à une prédiction exploitable.'
})

function stopLivePolling() {
  if (livePoller) clearInterval(livePoller)
  livePoller = null
}

function startLivePolling() {
  stopLivePolling()
  livePoller = setInterval(async () => {
    await sessionStore.fetchHistory()
    await loadMeasures()
    if (!isLiveSession.value) stopLivePolling()
  }, 5000)
}

onMounted(async () => {
  loading.value = true
  try {
    if (!sessionStore.history?.length || !session.value) {
      await sessionStore.fetchHistory()
    }
    await loadMeasures()
    await loadAiInsights()
    if (isLiveSession.value) startLivePolling()
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  stopLivePolling()
})

const session = computed(() =>
  sessionStore.history.find(s => s._id === props.sessionMongoId)
)

const isLiveSession = computed(() => !!session.value && !session.value.endDate)

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
    .map(p => ({ date: new Date(p.date), value: Number(p.value) }))
    .filter(p => Number.isFinite(p.value))
)

const speedLabel = computed(() => {
  const arr = speedSeriesKmH.value.map(x => x.value)
  if (!arr.length) return 'Vitesse: —'
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  return `Vitesse moy.: ${avg.toFixed(1)} km/h`
})

const gpsQualityLabel = computed(() => {
  const gps = stats.value?.quality?.gps
  if (!gps) return speedLabel.value
  return `${gps.message} (${gps.confidence}% confiance)`
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

const stressLabel = computed(() => {
  const value = stats.value?.stress ?? stress.value
  return Number.isFinite(value) ? Math.round(value) : '—'
})

const weightLabel = computed(() => {
  if (!stats.value?.score?.weights) return '—'
  const w = stats.value.score.weights
  return `${w.wLoad * 100}% / ${w.wIntensity * 100}% / ${w.wRecovery * 100}%`
})

const displayedSteps = computed(() => {
  return getSessionSteps(session.value, measures.value)
})

const stressSub = computed(() => {
  const hasRawSteps = measuresOf(measures.value, 'steps').length > 0

  if (hasRawSteps || displayedSteps.value) {
    return `Pas: ${displayedSteps.value}`
  }

  if (isLiveSession.value && stress.value != null) {
    return 'Estimation live basée sur RMSSD / cardio'
  }

  return ''
})

const dureeSub = computed(() => isLiveSession.value ? 'En cours' : '')

const modelMaeLabel = computed(() => {
  const mae = aiInsights.value?.prediction?.model?.metrics?.maeBpm
  return Number.isFinite(mae) ? mae.toFixed(1) + ' bpm' : '—'
})

const modelQualityLabel = computed(() => {
  const metrics = aiInsights.value?.prediction?.model?.metrics
  if (!metrics) return 'Validation indisponible'
  return metrics.beatsBaseline
    ? 'Meilleur que la baseline'
    : 'Ne bat pas encore la baseline'
})

function formatBpm(value) {
  return Number.isFinite(value) ? value.toFixed(1) + ' bpm' : '—'
}

function formatSignedBpm(value) {
  if (!Number.isFinite(value)) return '—'
  return (value > 0 ? '+' : '') + value.toFixed(1) + ' bpm'
}

function formatTarget(value, unit) {
  if (value == null || value === '') return '—'
  if (unit === 'km') return `${Number(value).toFixed(2)} km`
  return `${value} ${unit}`
}
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}
</script>


<style scoped>
.live-card {
  display: flex;
  gap: .75rem;
  align-items: center;
  margin-bottom: 1rem;
  border-color: rgba(34, 197, 94, .45);
}

.evaluation-box {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem 1.25rem;
  margin-top: .9rem;
  padding: .8rem;
  border: 1px solid rgba(34, 197, 94, .45);
  border-radius: 12px;
  background: rgba(34, 197, 94, .08);
}

.ai-recommendation {
  margin-top: 1rem;
  padding: .9rem;
  border: 1px solid rgba(96, 165, 250, .35);
  border-radius: 14px;
  background: rgba(59, 130, 246, .08);
}

.ai-recommendation h4 {
  margin: 0 0 .4rem 0;
}

.recommendation-summary {
  margin: 0 0 .75rem 0;
  font-weight: 700;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: .6rem;
}

.recommendation-grid div {
  display: flex;
  flex-direction: column;
  gap: .2rem;
  padding: .65rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(15, 23, 42, .35);
}

.insight-list {
  margin: .5rem 0 0 1.1rem;
  color: rgba(231, 238, 252, .88);
}

.warning-list {
  color: #fbbf24;
}
</style>
