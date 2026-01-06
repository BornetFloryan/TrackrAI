<template>
    <div class="page">
        <h1>Dashboard sportif</h1>

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
                    <button @click="reload" :disabled="loading">
                        Filtrer
                    </button>
                </div>
            </div>


            <p class="muted" style="margin-top:.75rem">
                Analyse globale des performances du sportif sélectionné.
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
            <div v-if="athleteInsight" class="grid grid-3" style="margin-top:1rem;">
                <div class="card">
                    <h4>Profil IA – Global</h4>
                    <p class="muted">
                        Score moyen :
                        <strong>{{ athleteInsight.avgScore.toFixed(1) }}</strong>
                    </p>
                </div>

                <div class="card">
                    <h4>Charge & Intensité</h4>
                    <ul class="muted">
                        <li>Charge : {{ athleteInsight.load.toFixed(1) }}</li>
                        <li>Intensité : {{ athleteInsight.intensity.toFixed(1) }}</li>
                    </ul>
                </div>

                <div class="card">
                    <h4>Récupération</h4>
                    <p class="muted">
                        {{ athleteInsight.recovery.toFixed(1) }}
                    </p>
                    <p class="muted">
                        <em>
                            {{
                                athleteInsight.intensity > athleteInsight.recovery
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
                    <option value="hrAvg">Fréquence cardiaque moyenne</option>
                    <option value="stress">Stress</option>
                </select>
            </div>

            <MetricLineChart v-if="sessions.length" :sessions="sessions" :metric="metric" :metrics="METRICS" />

        </template>
        <div class="card" style="margin-top:1rem;">
            <h3 style="margin:0 0 .5rem 0;">Séances du sportif</h3>

            <div class="grid grid-3" style="margin-bottom:1rem;">
                <div>
                    <label>Trier par</label>
                    <select v-model="sortBy">
                        <option value="date_desc">Date (récentes)</option>
                        <option value="date_asc">Date (anciennes)</option>
                        <option value="score_desc">Score (élevé)</option>
                        <option value="score_asc">Score (faible)</option>
                        <option value="durationMin">Durée (min)</option>
                        <option value="steps">Pas</option>
                    </select>
                </div>

                <div>
                    <label>Score minimum</label>
                    <input type="number" min="0" max="100" v-model.number="minScore" />
                </div>
            </div>

            <div class="grid">
                <div v-if="filteredSessions.length === 0" class="card muted">
                    Aucune séance ne correspond aux filtres.
                </div>

                <div v-for="s in filteredSessions" :key="s.sessionMongoId" class="card clickable"
                    @click="goToSession(s.sessionMongoId)">
                    <div style="display:flex; justify-content:space-between; gap:.75rem; flex-wrap:wrap;">
                        <div>
                            <div style="font-weight:900;">
                                {{ new Date(s.start).toLocaleString() }}
                            </div>
                            <div class="muted">
                                Distance: {{ s.distanceKm?.toFixed(2) ?? '—' }} km
                                • Pas: {{ s.steps ?? 0 }}
                            </div>
                        </div>

                        <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
                            <span class="badge">Score: {{ Math.round(s.score) }}</span>
                            <span class="badge">HR avg: {{ Math.round(s.hrAvg ?? 0) }}</span>
                            <span class="badge">Stress: {{ s.stress ?? '—' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '../store/session.store'

import MetricLineChart from '../components/MetricLineChart.vue'
import StatCard from '../components/StatCard.vue'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const userId = route.params.userId

const days = ref(7)
const loading = ref(false)
const sessions = ref([])
const sortBy = ref('date_desc')
const minScore = ref(0)
const metric = ref('score')

const METRICS = {
    score: { label: 'Score global', get: s => s.score, min: 0, max: 100 },
    distanceKm: { label: 'Distance (km)', get: s => s.distanceKm, min: 0 },
    hrAvg: { label: 'FC moyenne (bpm)', get: s => s.hrAvg, min: 60, max: 200 },
    stress: { label: 'Stress', get: s => s.stress, min: 0, max: 100 },

    durationMin: { label: 'Durée (min)', get: s => s.durationMin, min: 0 },
    steps: { label: 'Pas', get: s => s.steps, min: 0 }
}


onMounted(async () => {
    await reload()
})

async function reload() {
    loading.value = true
    try {
        let list = await sessionStore.fetchHistory()

        const minDate =
            Date.now() - days.value * 24 * 3600 * 1000

        list = list
            .filter(s => s.user?._id === userId)
            .filter(s => new Date(s.startDate).getTime() >= minDate)
            .sort(
                (a, b) =>
                    new Date(a.startDate) - new Date(b.startDate)
            )

        sessions.value = list.map(s => ({
            sessionMongoId: s._id,
            start: s.startDate,

            stats: s.stats,

            durationMin: Math.round((s.stats?.durationMs ?? 0) / 60000),
            distanceKm: s.stats?.distanceKm,
            hrAvg: s.stats?.hrAvg,
            hrMax: s.stats?.hrMax,
            steps: s.stats?.steps,
            stress: s.stats?.stress,

            score: s.stats?.score?.global ?? null
        }))

    } finally {
        loading.value = false
    }
}

function goToSession(id) {
    router.push(`/sessions/${id}`)
}

const totalDistanceLabel = computed(() =>
    `${sessions.value
        .reduce((a, s) => a + (s.distanceKm ?? 0), 0)
        .toFixed(2)} km`
)

const hrAvgLabel = computed(() => {
    const v = sessions.value.map(s => s.hrAvg).filter(Boolean)
    return v.length
        ? `${Math.round(
            v.reduce((a, b) => a + b, 0) / v.length
        )} bpm`
        : '—'
})

const hrMaxLabel = computed(() => {
    const v = sessions.value.map(s => s.hrMax).filter(Boolean)
    return v.length ? `${Math.max(...v)} bpm` : '—'
})

const stepsTotalLabel = computed(() =>
    `${sessions.value.reduce(
        (a, s) => a + (s.steps ?? 0),
        0
    )}`
)

const stressAvgLabel = computed(() => {
    const v = sessions.value.map(s => s.stress).filter(Boolean)
    return v.length
        ? `${Math.round(
            v.reduce((a, b) => a + b, 0) / v.length
        )}/100`
        : '—'
})

const filteredSessions = computed(() => {
    let list = [...sessions.value]

    if (minScore.value > 0) {
        list = list.filter(
            s => s.score != null && s.score >= minScore.value
        )
    }

    switch (sortBy.value) {
        case 'date_asc':
            list.sort((a, b) => new Date(a.start) - new Date(b.start))
            break
        case 'date_desc':
            list.sort((a, b) => new Date(b.start) - new Date(a.start))
            break
        case 'score_desc':
            list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            break
        case 'score_asc':
            list.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
            break
        case 'durationMin':
            list.sort((a, b) => (b.durationMin ?? 0) - (a.durationMin ?? 0))
            break
        case 'steps':
            list.sort((a, b) => (b.steps ?? 0) - (a.steps ?? 0))
            break
    }

    return list
})

const athleteInsight = computed(() => {
  const list = sessions.value.filter(
    s => s.stats?.score?.components
  )

  if (!list.length) return null

  let avgScore = 0
  let load = 0
  let intensity = 0
  let recovery = 0

  for (const s of list) {
    const score = s.stats.score
    avgScore += score.global
    load += score.components.load
    intensity += score.components.intensity
    recovery += score.components.recovery
  }

  const count = list.length

  return {
    avgScore: avgScore / count,
    load: load / count,
    intensity: intensity / count,
    recovery: recovery / count
  }
})
</script>