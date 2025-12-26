<template>
  <div class="chart">
    <Line v-if="measures.length" :data="chartData" :options="chartOptions" />
    <p v-else>Aucune donnée</p>
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

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
)

const props = defineProps({
  measures: { type: Array, required: true },
  type: { type: String, default: 'hr' }, // hr | speed | cadence
})

const config = {
  hr: { label: 'Fréquence cardiaque', unit: 'BPM', color: '#ef4444' },
  speed: { label: 'Vitesse', unit: 'km/h', color: '#3b82f6' },
  cadence: { label: 'Cadence', unit: 'spm', color: '#10b981' },
}

const chartData = computed(() => {
  const c = config[props.type]

  return {
    labels: props.measures.map(m =>
      new Date(m.date).toLocaleTimeString()
    ),
    datasets: [
      {
        label: `${c.label} (${c.unit})`,
        data: props.measures.map(m => Number(m.value) || 0),
        borderColor: c.color,
        backgroundColor: 'transparent',
        tension: 0.3,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
  },
  scales: {
    y: { beginAtZero: false },
  },
}
</script>

<style scoped>
.chart {
  height: 300px;
}
</style>
