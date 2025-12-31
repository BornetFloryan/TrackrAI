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

const videoFile = ref(null)
const result = ref(null)
const loading = ref(false)

function onFile(e) {
  videoFile.value = e.target.files[0]
}

async function sendVideo() {
  if (!videoFile.value) return
  loading.value = true
  result.value = null

  const ws = new WebSocket(import.meta.env.VITE_ANALYZE_WS_URL)
  await ws.waitOpen()

  ws.sendJson({
    type: 'START',
    exercise: 'squat',
    size: videoFile.value.size
  })

  const buffer = await videoFile.value.arrayBuffer()
  ws.sendBinary(buffer)
  ws.sendJson({ type: 'END' })

  ws.ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'RESULT') {
      result.value = msg.analysis
      loading.value = false
      ws.close()
    }
  }
}
</script>
