<template>
  <div class="page">
    <h1>Analyse vidéo</h1>

    <div class="card">
      <p class="muted">
        Lancez une analyse vidéo puis consultez l'historique sur la même page.
        Le squat est le mode le plus fiable ; développé couché et soulevé de terre restent expérimentaux.
      </p>

      <label class="form-field">
        <span>Exercice</span>
        <select v-model="exercise">
          <option value="squat">Squat</option>
          <option value="bench">Développé couché expérimental</option>
          <option value="deadlift">Soulevé de terre expérimental</option>
        </select>
      </label>

      <input type="file" accept="video/*" @change="onFile" />

      <button @click="sendVideo" :disabled="loading || !videoFile" style="margin-top:.75rem;">
        {{ loading ? 'Analyse en cours…' : 'Analyser' }}
      </button>

      <p v-if="progress" class="muted">{{ progress }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div v-if="result" class="card" style="margin-top:1rem;">
      <p class="muted">Exercice analysé : {{ exerciseLabels[resultExercise] || resultExercise }}</p>
      <h3>Score : {{ result.score }}</h3>
      <ul>
        <li v-for="e in result.errors" :key="e">{{ e }}</li>
      </ul>
      <ul>
        <li v-for="t in result.tips" :key="t">{{ t }}</li>
      </ul>
      <p v-if="analysisId" class="muted mono">Analyse stockée : {{ analysisId }}</p>
    </div>

    <div class="card" style="margin-top:1rem;">
      <div style="display:flex; justify-content:space-between; gap:1rem; align-items:center; flex-wrap:wrap;">
        <div>
          <h2 style="margin:0;">Historique vidéo</h2>
          <p class="muted" style="margin:.35rem 0 0;">
            Scores, répétitions, erreurs détectées et conseils des analyses précédentes.
          </p>
        </div>

        <button class="secondary" @click="loadAnalyses" :disabled="historyLoading">
          {{ historyLoading ? 'Chargement…' : 'Rafraîchir' }}
        </button>
      </div>

      <p v-if="historyError" class="error">{{ historyError }}</p>
    </div>

    <div v-if="historyLoading" class="card" style="margin-top:1rem;">
      Chargement des analyses…
    </div>

    <div v-else-if="!analyses.length" class="card" style="margin-top:1rem;">
      <p class="muted">
        Aucune analyse stockée pour le moment. Lancez une analyse vidéo pour alimenter cet historique.
      </p>
    </div>

    <div v-else class="grid" style="margin-top:1rem;">
      <div v-for="item in analyses" :key="item.analysisId" class="card">
        <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
          <div>
            <h3 style="margin-bottom:.25rem;">{{ exerciseLabel(item) }}</h3>
            <p class="muted" style="margin:0;">{{ new Date(item.date).toLocaleString() }}</p>
            <p class="muted" style="margin:.25rem 0 0;">Analyse lancée par : <strong>{{ authorOf(item) }}</strong></p>
            <p class="muted mono" style="margin:.35rem 0 0;">{{ item.analysisId }}</p>
          </div>

          <div class="score">
            {{ scoreOf(item) }}
            <span>/100</span>
          </div>
        </div>

        <div class="grid grid-3" style="margin-top:1rem;">
          <div class="mini">
            <strong>{{ repetitionsOf(item) }}</strong>
            <span>répétition(s)</span>
          </div>
          <div class="mini">
            <strong>{{ errorsOf(item).length }}</strong>
            <span>erreur(s)</span>
          </div>
          <div class="mini">
            <strong>{{ tipsOf(item).length }}</strong>
            <span>conseil(s)</span>
          </div>
        </div>

        <div class="grid grid-2" style="margin-top:1rem;">
          <div>
            <h4>Erreurs détectées</h4>
            <p v-if="!errorsOf(item).length" class="muted">Aucune erreur majeure.</p>
            <ul v-else class="muted">
              <li v-for="err in errorsOf(item)" :key="err">{{ err }}</li>
            </ul>
          </div>

          <div>
            <h4>Conseils</h4>
            <p v-if="!tipsOf(item).length" class="muted">Aucun conseil disponible.</p>
            <ul v-else class="muted">
              <li v-for="tip in tipsOf(item)" :key="tip">{{ tip }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { AnalysisSocket } from '../services/analysis.ws'
import measureService from '../services/measure.service'
import { useAuthStore } from '../store/auth.store'
import { useMeasureStore } from '../store/measure.store'

const auth = useAuthStore()
const measureStore = useMeasureStore()
const videoFile = ref(null)
const result = ref(null)
const resultExercise = ref('')
const exercise = ref('squat')
const loading = ref(false)
const historyLoading = ref(false)
const analysisId = ref('')
const error = ref('')
const historyError = ref('')
const progress = ref('')
const analyses = computed(() => measureStore.analyses)

const exerciseLabels = {
  squat: 'Squat',
  bench: 'Développé couché',
  deadlift: 'Soulevé de terre'
}

onMounted(loadAnalyses)

function onFile(e) {
  videoFile.value = e.target.files[0]
}

function bufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function loadAnalyses() {
  historyLoading.value = true
  historyError.value = ''
  try {
    await measureStore.fetchAnalyses()
  } catch (e) {
    historyError.value = e?.message || 'Impossible de charger les analyses vidéo'
  } finally {
    historyLoading.value = false
  }
}

async function sendVideo() {
  if (!videoFile.value) return

  loading.value = true
  result.value = null
  resultExercise.value = ''
  analysisId.value = ''
  error.value = ''
  progress.value = 'Connexion au serveur d’analyse…'

  let socket
  try {
    socket = new AnalysisSocket()
    await socket.waitOpen()
  } catch (e) {
    console.error('WS error', e)
    loading.value = false
    progress.value = ''
    error.value = 'Impossible de se connecter au serveur d’analyse'
    return
  }

  socket.send({
    type: 'START_ANALYSIS',
    exercise: exercise.value,
    userId: auth.userId || auth.login || 'anonymous',
    meta: { login: auth.login },
  })

  progress.value = 'Envoi de la vidéo…'

  const buffer = await videoFile.value.arrayBuffer()
  socket.send({ type: 'VIDEO_CHUNK', data: bufferToBase64(buffer) })

  progress.value = 'Analyse du mouvement…'
  socket.send({ type: 'END_ANALYSIS' })

  socket.onMessage(async (msg) => {
    if (msg.type === 'ACK' && msg.kind === 'ANALYSIS_STARTED') {
      progress.value = 'Analyse en cours…'
    }

    if (msg.type === 'PROGRESS') {
      progress.value = `Vidéo reçue : ${Math.round((msg.bytesReceived || 0) / 1024)} Ko`
    }

    if (msg.type === 'ERROR') {
      error.value = msg.message || 'Analyse vidéo impossible'
      progress.value = ''
      loading.value = false
      socket.close()
      return
    }

    if (msg.type === 'RESULT') {
      result.value = msg.data.analysis
      resultExercise.value = msg.data.exercise || exercise.value
      analysisId.value = msg.data.analysisId

      try {
        await measureService.saveAnalysis({
          analysisId: msg.data.analysisId,
          exercise: msg.data.exercise || exercise.value,
          result: msg.data,
          type: 'SPORT',
          date: new Date().toISOString(),
        })
        await loadAnalyses()
      } catch (e) {
        historyError.value = e?.message || "L'analyse est terminee mais n'a pas pu etre stockee dans l'historique"
      }

      loading.value = false
      progress.value = ''
      socket.close()
    }
  })
}

function analysisOf(item) {
  return item.result?.analysis || {}
}

function exerciseLabel(item) {
  return exerciseLabels[item.result?.exercise] || item.result?.exercise || item.type || 'Analyse vidéo'
}
function authorOf(item) {
  return item.result?.userLogin || item.result?.meta?.login || item.result?.userId || 'Utilisateur inconnu'
}


function scoreOf(item) {
  const score = analysisOf(item).score
  return Number.isFinite(score) ? score : '—'
}

function repetitionsOf(item) {
  const reps = analysisOf(item).metrics?.repetitions
  return Number.isFinite(reps) ? reps : 0
}

function errorsOf(item) {
  return analysisOf(item).errors || []
}

function tipsOf(item) {
  return analysisOf(item).tips || []
}
</script>

<style scoped>
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: .8rem;
}

.score {
  min-width: 90px;
  text-align: center;
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--brand);
}

.score span {
  font-size: .85rem;
  color: var(--muted);
}

.mini {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .75rem;
  background: rgba(255,255,255,.03);
}

.mini strong {
  display: block;
  font-size: 1.4rem;
}

.mini span {
  color: var(--muted);
  font-size: .85rem;
}
</style>
