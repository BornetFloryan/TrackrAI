<template>
  <div class="dash">
    <h1>Dashboard</h1>

    <button @click="refresh">Recharger</button>

    <MeasureChart :measures="measures" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useMeasureStore } from '../store/measure.store'
import MeasureChart from '../components/MeasureChart.vue'

const store = useMeasureStore()
const measures = ref([])

async function refresh() {
  measures.value = await store.fetch()
}

onMounted(refresh)
</script>

<style>
.dash {
  width: 800px;
  margin: auto;
}
</style>