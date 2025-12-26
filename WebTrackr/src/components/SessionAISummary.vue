<template>
  <div class="card" v-if="result">
    <h3>Analyse IA</h3>
    <p><strong>Fatigue :</strong> {{ result.fatigue }} / 100</p>
    <p><strong>Niveau :</strong> {{ result.level }}</p>
    <p><strong>Conseil :</strong> {{ result.advice }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import aiService from '../services/ai.service'

const props = defineProps({
  session: { type: Object, required: true }
})

const result = ref(null)

onMounted(async () => {
  result.value = await aiService.analyzeSession(props.session)
})
</script>

<style scoped>
.card {
  padding: 1rem;
  border: 1px solid #ddd;
  margin-top: 1rem;
}
</style>
