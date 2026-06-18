<template>
  <div class="page">
    <h1>Comparer deux séances</h1>

    <div class="card">
      <p class="muted">
        Sélectionnez deux séances pour visualiser l'évolution. Le sportif voit
        une comparaison simple ; le coach dispose d'une lecture plus orientée
        progression, fatigue et qualité de données.
      </p>

      <div class="grid grid-3" style="margin-top: 1rem">
        <label v-if="isCoach" class="form-field">
          <span>Sportif</span>

          <select v-model="athleteId">
            <option value="">Tous mes sportifs</option>

            <option
              v-for="athlete in athletes"
              :key="athlete.id"
              :value="athlete.id"
            >
              {{ athlete.login }}
            </option>
          </select>
        </label>

        <label class="form-field">
          <span>Séance de référence</span>

          <select v-model="leftId">
            <option value="">Choisir une séance</option>

            <option
              v-for="session in selectableSessions"
              :key="session._id"
              :value="session._id"
            >
              {{ sessionLabel(session) }}
            </option>
          </select>
        </label>

        <label class="form-field">
          <span>Séance comparée</span>

          <select v-model="rightId">
            <option value="">Choisir une séance</option>

            <option
              v-for="session in selectableSessions"
              :key="session._id"
              :value="session._id"
            >
              {{ sessionLabel(session) }}
            </option>
          </select>
        </label>
      </div>

      <button
        style="margin-top: 1rem"
        :disabled="loading"
        @click="load"
      >
        {{ loading ? 'Chargement…' : 'Rafraîchir' }}
      </button>
    </div>

    <div
      v-if="loading"
      class="card"
      style="margin-top: 1rem"
    >
      Chargement…
    </div>

    <div
      v-else-if="!leftSession || !rightSession"
      class="card muted"
      style="margin-top: 1rem"
    >
      Choisissez deux séances terminées pour afficher la comparaison.
    </div>

    <template v-else>
      <div class="grid grid-2" style="margin-top: 1rem">
        <div class="card session-card">
          <div class="session-heading">
            <span class="session-kicker">Séance A</span>
            <h2>{{ shortSessionDate(leftSession) }}</h2>
            <p class="muted">Référence</p>
          </div>

          <MetricSummary :session="leftSession" />
        </div>

        <div class="card session-card">
          <div class="session-heading">
            <span class="session-kicker">Séance B</span>
            <h2>{{ shortSessionDate(rightSession) }}</h2>
            <p class="muted">Comparée</p>
          </div>

          <MetricSummary :session="rightSession" />
        </div>
      </div>

      <div class="card" style="margin-top: 1rem">
        <div class="chart-header">
          <div>
            <h3>Graphique de comparaison</h3>

            <p class="muted">
              Changez la métrique pour comparer les séances point par point.
            </p>
          </div>

          <label class="form-field compact">
            <span>Métrique</span>

            <select v-model="chartMetric">
              <option value="all">Toutes les métriques</option>

              <option
                v-for="metric in metrics"
                :key="metric.key"
                :value="metric.key"
              >
                {{ metric.label }}
              </option>
            </select>
          </label>
        </div>

        <div class="chart-box">
          <Bar
            :data="chartData"
            :options="chartOptions"
          />
        </div>
      </div>

      <div class="card" style="margin-top: 1rem">
        <h3>Évolution détaillée</h3>

        <div class="comparison-grid">
          <div
            v-for="metric in metrics"
            :key="metric.key"
            class="metric-row"
          >
            <span class="metric-label">
              {{ metric.label }}
            </span>

            <strong :class="deltaClass(metric)">
              {{ deltaLabel(metric) }}
            </strong>

            <small class="muted">
              {{ valueLabel(leftSession, metric) }}
              →
              {{ valueLabel(rightSession, metric) }}
            </small>
          </div>
        </div>
      </div>

      <div
        v-if="isCoach"
        class="card"
        style="margin-top: 1rem"
      >
        <h3>Lecture coach</h3>

        <p class="muted">
          Cette vue ajoute une interprétation utile pour l'encadrement :
          progression, fatigue potentielle et qualité des données.
        </p>

        <ul class="muted coach-notes">
          <li
            v-for="note in coachNotes"
            :key="note"
          >
            {{ note }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js'

import {
  computed,
  defineComponent,
  h,
  onMounted,
  ref
} from 'vue'

import { Bar } from 'vue-chartjs'
import { useAuthStore } from '../store/auth.store'
import { useSessionStore } from '../store/session.store'

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

const auth = useAuthStore()
const sessionStore = useSessionStore()

const loading = ref(false)
const sessions = ref([])
const athleteId = ref('')
const leftId = ref('')
const rightId = ref('')
const chartMetric = ref('all')

const isCoach = computed(() => {
  return auth.rights?.includes('coach')
})

const metrics = [
  {
    key: 'score',
    label: 'Score global',
    unit: ' pts',
    getter: session => session.stats?.score?.global,
    higherIsBetter: true
  },
  {
    key: 'distance',
    label: 'Distance',
    unit: ' km',
    getter: session => session.stats?.distanceKm,
    higherIsBetter: true
  },
  {
    key: 'duration',
    label: 'Durée',
    unit: ' min',
    getter: session =>
      session.stats?.durationMs
        ? session.stats.durationMs / 60000
        : null,
    higherIsBetter: null
  },
  {
    key: 'hrAvg',
    label: 'Cardio moyen',
    unit: ' bpm',
    getter: session => session.stats?.hrAvg,
    higherIsBetter: null
  },
  {
    key: 'stress',
    label: 'Stress',
    unit: '',
    getter: session => session.stats?.stress,
    higherIsBetter: false
  },
  {
    key: 'steps',
    label: 'Pas',
    unit: '',
    getter: session => session.stats?.steps,
    higherIsBetter: true
  }
]

const MetricSummary = defineComponent({
  name: 'MetricSummary',

  props: {
    session: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    return () =>
      h(
        'div',
        {
          class: 'mini-grid'
        },
        metrics.map(metric =>
          h(
            'div',
            {
              class: 'mini',
              key: metric.key
            },
            [
              h(
                'span',
                {
                  class: 'mini-label'
                },
                `${metric.label} `
              ),

              h(
                'strong',
                {
                  class: 'mini-value'
                },
                valueLabel(props.session, metric)
              )
            ]
          )
        )
      )
  }
})

onMounted(load)

async function load() {
  loading.value = true

  try {
    const list = await sessionStore.fetchHistory()

    sessions.value = list.filter(session => {
      return session.endDate && session.stats
    })

    if (!leftId.value && sessions.value[1]) {
      leftId.value = sessions.value[1]._id
    }

    if (!rightId.value && sessions.value[0]) {
      rightId.value = sessions.value[0]._id
    }
  } finally {
    loading.value = false
  }
}

const athletes = computed(() => {
  const athletesMap = new Map()

  for (const session of sessions.value) {
    const user = session.user

    if (user?._id) {
      athletesMap.set(String(user._id), {
        id: String(user._id),
        login: user.login || 'Sportif'
      })
    }
  }

  return [...athletesMap.values()].sort((first, second) => {
    return first.login.localeCompare(second.login)
  })
})

const selectableSessions = computed(() => {
  let list = sessions.value

  if (isCoach.value && athleteId.value) {
    list = list.filter(session => {
      return String(sessionUserId(session)) === String(athleteId.value)
    })
  }

  return list
})

const leftSession = computed(() => {
  return selectableSessions.value.find(session => {
    return session._id === leftId.value
  })
})

const rightSession = computed(() => {
  return selectableSessions.value.find(session => {
    return session._id === rightId.value
  })
})

const displayedChartMetrics = computed(() => {
  if (chartMetric.value === 'all') {
    return metrics
  }

  return metrics.filter(metric => {
    return metric.key === chartMetric.value
  })
})

const chartData = computed(() => ({
  labels: displayedChartMetrics.value.map(metric => metric.label),

  datasets: [
    {
      label: 'Séance A',
      data: displayedChartMetrics.value.map(metric => {
        return numberValue(leftSession.value, metric)
      }),
      backgroundColor: 'rgba(56, 189, 248, .62)',
      borderColor: '#38bdf8',
      borderWidth: 1
    },
    {
      label: 'Séance B',
      data: displayedChartMetrics.value.map(metric => {
        return numberValue(rightSession.value, metric)
      }),
      backgroundColor: 'rgba(34, 197, 94, .62)',
      borderColor: '#22c55e',
      borderWidth: 1
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#e5e7eb'
      }
    },

    tooltip: {
      callbacks: {
        label: context => {
          const metric =
            displayedChartMetrics.value[context.dataIndex]

          const value = context.raw

          return `${context.dataset.label}: ${formatNumber(
            value,
            metric
          )}${metric?.unit || ''}`
        }
      }
    }
  },

  scales: {
    x: {
      ticks: {
        color: '#9ca3af'
      },

      grid: {
        color: 'rgba(255, 255, 255, 0.06)'
      }
    },

    y: {
      beginAtZero: true,

      ticks: {
        color: '#9ca3af'
      },

      grid: {
        color: 'rgba(255, 255, 255, 0.08)'
      }
    }
  }
}))

const coachNotes = computed(() => {
  if (!leftSession.value || !rightSession.value) {
    return []
  }

  const notes = []

  const scoreDelta = deltaFor(metrics[0])
  const distanceDelta = deltaFor(metrics[1])
  const hrDelta = deltaFor(metrics[3])
  const stressDelta = deltaFor(metrics[4])

  if (scoreDelta != null) {
    notes.push(
      scoreDelta >= 0
        ? 'Le score global progresse entre les deux séances.'
        : 'Le score global baisse : vérifier fatigue, contexte ou qualité de mesure.'
    )
  }

  if (distanceDelta != null && distanceDelta > 0) {
    notes.push(
      'La charge externe augmente avec une distance plus importante.'
    )
  }

  if (stressDelta != null && stressDelta > 0) {
    notes.push(
      'Le stress physiologique augmente : prévoir une récupération adaptée.'
    )
  }

  if (hrDelta != null && hrDelta > 8) {
    notes.push(
      'La fréquence cardiaque moyenne augmente nettement : possible intensité supérieure ou fatigue.'
    )
  }

  const gpsQuality = rightSession.value.stats?.quality?.gps
  const stepsQuality = rightSession.value.stats?.quality?.steps

  if (gpsQuality) {
    notes.push(
      `Qualité GPS séance B : ${gpsQuality.message} (${gpsQuality.confidence}% confiance).`
    )
  }

  if (stepsQuality) {
    notes.push(
      `Qualité pas séance B : ${stepsQuality.message} (${stepsQuality.confidence}% confiance).`
    )
  }

  return notes.length
    ? notes
    : [
        'Évolution stable : pas de variation majeure détectée sur les indicateurs disponibles.'
      ]
})

function sessionUserId(session) {
  return typeof session.user === 'object'
    ? session.user?._id
    : session.user
}

function sessionLabel(session) {
  const userLabel =
    isCoach.value && session.user?.login
      ? `${session.user.login} - `
      : ''

  return `${userLabel}${new Date(
    session.startDate
  ).toLocaleString()}`
}

function shortSessionDate(session) {
  return new Date(session.startDate).toLocaleString()
}

function numberValue(session, metric) {
  if (!session) {
    return null
  }

  const value = metric.getter(session)

  return Number.isFinite(value) ? value : null
}

function deltaFor(metric) {
  const firstValue = numberValue(leftSession.value, metric)
  const secondValue = numberValue(rightSession.value, metric)

  if (firstValue == null || secondValue == null) {
    return null
  }

  return secondValue - firstValue
}

function formatNumber(value, metric) {
  if (value == null) {
    return '—'
  }

  if (metric?.key === 'duration') {
    return value.toFixed(1)
  }

  if (metric?.key === 'distance') {
    return value.toFixed(2)
  }

  if (metric?.key === 'score') {
    return value.toFixed(1)
  }

  return String(Math.round(value))
}

function valueLabel(session, metric) {
  const value = numberValue(session, metric)

  if (value == null) {
    return '—'
  }

  return `${formatNumber(value, metric)}${metric.unit}`
}

function deltaLabel(metric) {
  const delta = deltaFor(metric)

  if (delta == null) {
    return '—'
  }

  const sign = delta > 0 ? '+' : ''

  return `${sign}${formatNumber(delta, metric)}${metric.unit}`
}

function deltaClass(metric) {
  const delta = deltaFor(metric)

  if (
    delta == null ||
    metric.higherIsBetter == null ||
    delta === 0
  ) {
    return ''
  }

  return (delta > 0) === metric.higherIsBetter
    ? 'positive'
    : 'negative'
}
</script>

<style scoped>
.session-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-heading h2,
.chart-header h3 {
  margin: 0.2rem 0;
}

.session-kicker {
  color: var(--brand);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.form-field.compact {
  min-width: 220px;
}

.chart-box {
  height: 360px;
}

.comparison-grid,
.mini-grid {
  display: grid;
  gap: 0.85rem;
}

.comparison-grid {
  grid-template-columns: repeat(
    auto-fit,
    minmax(180px, 1fr)
  );
}

.mini-grid {
  grid-template-columns: repeat(
    auto-fit,
    minmax(135px, 1fr)
  );
}

.metric-row,
.mini {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.9rem;
  background: rgba(255, 255, 255, 0.035);
}

.metric-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mini {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric-label,
.mini-label {
  display: block;
  color: var(--muted);
  font-size: 0.82rem;
}

.metric-row strong,
.mini strong {
  display: block;
  font-size: 1.35rem;
  line-height: 1.25;
  word-break: break-word;
}

.positive {
  color: #22c55e;
}

.negative {
  color: #fb7185;
}

.coach-notes li {
  margin: 0.35rem 0;
}
</style>