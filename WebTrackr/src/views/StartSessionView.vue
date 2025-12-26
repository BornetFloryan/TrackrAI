<template>
  <div class="start">
    <h2>Démarrer une séance</h2>

    <label>Module :</label>
    <select v-model="moduleKey" :disabled="loading">
      <option disabled value="">{{ loading ? 'Chargement...' : 'Sélectionner...' }}</option>
      <option v-for="m in modules" :value="m.key" :key="m._id">
        {{ m.name }}
      </option>
    </select>

    <button @click="start" :disabled="!moduleKey || loading">Démarrer</button>

    <LiveMeasureCard label="Live BPM" :value="lastBpm" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useModuleStore } from '../store/module.store'
import { useSessionStore } from '../store/session.store'
import LiveMeasureCard from '../components/LiveMeasureCard.vue'

const moduleStore = useModuleStore()
const session = useSessionStore()

const { modules } = storeToRefs(moduleStore)

const moduleKey = ref('')
const lastBpm = ref('--')
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await moduleStore.fetch()
  } catch (err) {
    console.error('Erreur fetch modules:', err)
  } finally {
    loading.value = false
  }
})

async function start() {
  if (!moduleKey.value) return

  try {
    await session.start(moduleKey.value)
    alert('Session démarrée')
  } catch (err) {
    alert('Erreur démarrage session')
    console.error(err)
  }
}
</script>