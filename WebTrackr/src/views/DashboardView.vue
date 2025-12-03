<template>
  <div class="dash">
    <h1>Dashboard</h1>

    <button @click="reload">Recharger</button>

    <MeasureChart :measures="measures" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MeasureChart from '../components/MeasureChart.vue'
import { useMeasureStore } from '../store/measure.store'

const store = useMeasureStore()
const measures = ref([])

async function reload() {
  measures.value = await store.fetch()
}

onMounted(reload)
</script>
