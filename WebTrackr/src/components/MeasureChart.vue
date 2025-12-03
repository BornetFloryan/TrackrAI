<template>
  <div>
    <Line :data="chartData" :options="chartOptions" />
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
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const props = defineProps({
  measures: { type: Array, required: true }
})

const chartData = computed(() => ({
  labels: props.measures.map(m => new Date(m.date).toLocaleTimeString()),
  datasets: [
    {
      label: 'BPM',
      data: props.measures.map(m => Number(m.value)),
      borderColor: '#3b82f6',
      backgroundColor: 'transparent'
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}
</script>
