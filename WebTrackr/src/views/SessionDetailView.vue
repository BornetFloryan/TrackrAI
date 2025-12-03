<template>
  <div>
    <h1>Séance du {{ day }}</h1>

    <MeasureChart :measures="measures" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMeasureStore } from '../store/measure.store'
import MeasureChart from '../components/MeasureChart.vue'

const props = defineProps({ day: String })
const store = useMeasureStore()

const measures = computed(() =>
  store.list.filter(
    m => new Date(m.date).toLocaleDateString() === props.day
  )
)
</script>
