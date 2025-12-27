<template>
  <div class="page">
    <h1>Vidéo (mobile)</h1>

    <div class="card">
      <p style="margin:0; color:var(--muted)">
        Page prête pour envoyer une courte vidéo vers ton futur serveur MediaPipe.
        Pour l’instant : capture/preview + upload “stub”.
      </p>
    </div>

    <div class="card" style="margin-top:1rem;">
      <h3 style="margin:0 0 .6rem 0;">Capture</h3>

      <input type="file" accept="video/*" capture="environment" @change="onPick" />

      <div v-if="url" style="margin-top:1rem;">
        <video :src="url" controls playsinline style="width:100%; border-radius:14px; border:1px solid var(--border)"></video>

        <div style="display:flex; gap:.5rem; margin-top:.75rem; flex-wrap:wrap;">
          <button @click="upload" :disabled="uploading">Envoyer (stub)</button>
          <button class="secondary" @click="clear">Réinitialiser</button>
        </div>

        <p style="color:var(--muted)" v-if="uploadMsg">{{ uploadMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const file = ref(null)
const url = ref('')
const uploading = ref(false)
const uploadMsg = ref('')

function onPick(e) {
  uploadMsg.value = ''
  const f = e.target.files?.[0]
  if (!f) return
  file.value = f
  url.value = URL.createObjectURL(f)
}

function clear() {
  file.value = null
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = ''
  uploadMsg.value = ''
}

async function upload() {
  if (!file.value) return
  uploading.value = true
  uploadMsg.value = ''
  try {
    // TODO futur: POST vers serveur mediapipe (multipart/form-data)
    await new Promise(r => setTimeout(r, 500))
    uploadMsg.value = '✅ Vidéo prête à être envoyée (endpoint MediaPipe à brancher).'
  } finally {
    uploading.value = false
  }
}
</script>
