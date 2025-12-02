<template>
  <div>
    <Line :data="chartData" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale)

const props = defineProps({
  measures: Array
})

const chartData = computed(() => ({
  labels: props.measures.map(m => new Date(m.date).toLocaleTimeString()),
  datasets: [
    {
      label: "FC (bpm)",
      data: props.measures.map(m => m.value),
      borderColor: "blue"
    }
  ]
}))
</script>