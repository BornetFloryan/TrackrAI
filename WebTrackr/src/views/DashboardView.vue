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
          <h4>Profil global – Score</h4>
          <p class="muted">
            Score moyen :
            <strong>{{ globalInsight.avgScore.toFixed(1) }}</strong>
          </p>
        </div>

        <div class="card">
          <h4>Charge & Intensité</h4>
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
          <option value="score">Score global</option>
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
        <h3>Analyse IA – Score de séance</h3>

        <p class="muted" style="margin-bottom:.75rem">
          Le score affiché est un <strong>indice de qualité de séance</strong> compris entre 0 et 100.
          Il est produit par un modèle d’intelligence artificielle entraîné à partir des séances précédentes.
        </p>

        <h4 style="margin:.5rem 0;">1. Score de référence (baseline métier)</h4>
        <p class="muted">
          Chaque séance est d’abord évaluée à l’aide d’un score calculé à partir de règles métier,
          combinant plusieurs indicateurs physiologiques et mécaniques.
        </p>

        <ul class="muted">
          <li><strong>Charge d’entraînement (45 %)</strong> : distance parcourue rapportée à la durée</li>
          <li><strong>Intensité (45 %)</strong> : fréquence cardiaque moyenne de la séance</li>
          <li><strong>Récupération / stress (10 %)</strong> : indice dérivé du RMSSD ou de la FC</li>
        </ul>

        <p class="muted">
          Ces pondérations privilégient l’effort réellement produit tout en limitant l’impact du stress
          afin d’éviter une surévaluation des séances fatigantes.
        </p>

        <h4 style="margin:.75rem 0 .25rem;">2. Apprentissage par intelligence artificielle</h4>
        <p class="muted">
          Un modèle <strong>XGBoost</strong> est ensuite entraîné sur l’historique des séances,
          en utilisant le score de référence comme valeur cible.
          Il apprend automatiquement les relations entre durée, distance, fréquence cardiaque,
          stress et qualité globale de la séance.
        </p>

        <p class="muted">
          Le score affiché dans le graphique correspond à la <strong>prédiction du modèle IA</strong>,
          ce qui permet d’obtenir une évaluation cohérente, évolutive et adaptée au profil d’utilisation.
        </p>

        <p class="muted" style="margin-top:.5rem;">
          <em>
            Le score est relatif au jeu de données disponible et vise la comparaison inter-séances,
            et non une évaluation médicale absolue.
          </em>
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

import StatCard from '../components/StatCard.vue'
import GpsMap from '../components/GpsMap.vue'
import MetricLineChart from '../components/MetricLineChart.vue'

const router = useRouter()
const moduleStore = useModuleStore()
const sessionStore = useSessionStore()

const days = ref(7)
const loading = ref(false)
const sessions = ref([])
const globalGpsPoints = ref([])
const metric = ref('score')

const METRICS = {
  score: {
    label: 'Score global',
    get: s => s.score,
    min: 0,
    max: 100
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

      score: s.stats?.score?.global ?? null,
    }))



    globalGpsPoints.value = []
  } finally {
    loading.value = false
  }
}

const chartData = computed(() => ({
  labels: sessions.value.map(s => new Date(s.start).toLocaleString()),
  datasets: [{
    data: sessions.value.map(s => s.score ?? 0),
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
    s => s.stats?.score?.components
  )

  if (!list.length) return null

  let avgScore = 0
  let load = 0
  let intensity = 0
  let recovery = 0

  for (const s of list) {
    const c = s.stats.score.components
    avgScore += s.stats.score.global
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
</script>
