<template>
  <div class="page">
    <h1>Analyse vidéo</h1>

    <input type="file" accept="video/*" @change="onFile" />

    <button @click="sendVideo" :disabled="loading">
      {{ loading ? 'Analyse en cours…' : 'Analyser' }}
    </button>

    <div v-if="result" class="card">
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
import measureService from '../services/measure.service'

const videoFile = ref(null)
const result = ref(null)
const loading = ref(false)

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

  let socket
  try {
    socket = new AnalysisSocket()
    await socket.waitOpen()
  } catch (e) {
    console.error('WS error', e)
    loading.value = false
    alert('Impossible de se connecter au serveur d’analyse')
    return
  }

  socket.send({
    type: 'START_ANALYSIS',
    exercise: 'squat'
  })

  const buffer = await videoFile.value.arrayBuffer()
  socket.send({
    type: 'VIDEO_CHUNK',
    data: bufferToBase64(buffer)
  })

  socket.send({ type: 'END_ANALYSIS' })

  socket.onMessage(async (msg) => {
    if (msg.type === 'RESULT') {
      console.log('Received analysis result', msg)
      result.value = msg.data.analysis
      loading.value = false
      socket.close()

      console.log('Analysis stored with id', msg.data.analysisId)
    }
  })

}
</script>
