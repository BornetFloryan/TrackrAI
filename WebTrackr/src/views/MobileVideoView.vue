<template>
  <div class="page">
    <h1>Analyse vidéo</h1>

    <label class="form-field">
      <span>Exercice</span>
      <select v-model="exercise">
        <option value="squat">Squat</option>
        <option value="bench">Developpe couche experimental</option>
        <option value="deadlift">Souleve de terre experimental</option>
      </select>
    </label>

    <input type="file" accept="video/*" @change="onFile" />

    <button @click="sendVideo" :disabled="loading">
      {{ loading ? 'Analyse en cours…' : 'Analyser' }}
    </button>

    <p v-if="progress" class="muted">{{ progress }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <p v-if="analysisId" class="muted">
      Analyse stockée : <router-link to="/analyses">{{ analysisId }}</router-link>
    </p>

    <div v-if="result" class="card">
      <p class="muted">Exercice analyse : {{ exerciseLabels[resultExercise] || resultExercise }}</p>
      <h3>Score : {{ result.score }}</h3>
      <ul>
        <li v-for="e in result.errors" :key="e">❌ {{ e }}</li>
      </ul>
      <ul>
        <li v-for="t in result.tips" :key="t">💡 {{ t }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { AnalysisSocket } from '../services/analysis.ws'
import { useAuthStore } from '../store/auth.store'

const auth = useAuthStore()
const videoFile = ref(null)
const result = ref(null)
const resultExercise = ref('')
const exercise = ref('squat')
const loading = ref(false)
const analysisId = ref('')
const error = ref('')
const progress = ref('')
const exerciseLabels = {
  squat: 'Squat',
  bench: 'Developpe couche',
  deadlift: 'Souleve de terre'
}

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
    alert('Impossible de se connecter au serveur d’analyse')
    return
  }
  socket.send({
    type: 'START_ANALYSIS',
    exercise: exercise.value,
    userId: auth.userId || auth.login || 'anonymous',
    meta: {
      login: auth.login,
    },
  })

  progress.value = 'Envoi de la vidéo…'

  const buffer = await videoFile.value.arrayBuffer()
  socket.send({
    type: 'VIDEO_CHUNK',
    data: bufferToBase64(buffer)
  })

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
      console.log('Received analysis result', msg)
      result.value = msg.data.analysis
      resultExercise.value = msg.data.exercise || exercise.value
      analysisId.value = msg.data.analysisId
      loading.value = false
      progress.value = ''
      socket.close()

      console.log('Analysis stored with id', msg.data.analysisId)
    }
  })

}
</script>
