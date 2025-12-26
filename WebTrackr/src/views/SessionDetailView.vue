<template>
  <div class="page">
    <h1>Séance du {{ day }}</h1>

    <div v-if="measures.length === 0">
      <p>Aucune mesure pour cette séance.</p>
    </div>

    <div v-else class="charts">
      <MeasureChart
        type="hr"
        :measures="hrMeasures"
      />

      <MeasureChart
        type="speed"
        :measures="speedMeasures"
      />

      <MeasureChart
        type="cadence"
        :measures="cadenceMeasures"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMeasureStore } from '../store/measure.store'
import MeasureChart from '../components/MeasureChart.vue'

const props = defineProps({
  day: { type: String, required: true }
})

const store = useMeasureStore()

/* ======================
   FILTRAGE PAR JOUR
====================== */
const dayMeasures = computed(() =>
  store.list.filter(
    m => new Date(m.date).toLocaleDateString() === props.day
  )
)

/* ======================
   PAR TYPE DE MESURE
====================== */
const hrMeasures = computed(() =>
  dayMeasures.value
    .filter(m => m.type === 'hr')
    .map(m => ({ date: m.date, value: m.value }))
)

const speedMeasures = computed(() =>
  dayMeasures.value
    .filter(m => m.type === 'speed')
    .map(m => ({ date: m.date, value: m.value }))
)

const cadenceMeasures = computed(() =>
  dayMeasures.value
    .filter(m => m.type === 'cadence')
    .map(m => ({ date: m.date, value: m.value }))
)
</script>

<style scoped>
.page {
  padding: 1rem;
}

.charts {
  display: grid;
  gap: 2rem;
}
</style>
