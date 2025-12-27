<template>
  <div class="card">
    <div class="top">
      <div class="title">{{ title }}</div>
      <span class="badge" v-if="unit">{{ unit }}</span>
    </div>
    <div class="chart">
      <Line v-if="series.length" :data="chartData" :options="chartOptions" />
      <p v-else style="color:var(--muted); margin:0">Aucune donnée</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement, PointElement,
  LinearScale, CategoryScale,
  Tooltip, Legend
} from 'chart.js'
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const props = defineProps({
  title: { type: String, default: 'Mesure' },
  unit: { type: String, default: '' },
  series: { type: Array, default: () => [] }, // [{date: Date, value:number}]
})

const chartData = computed(() => ({
  labels: props.series.map(p => new Date(p.date).toLocaleTimeString()),
  datasets: [{
    label: props.title,
    data: props.series.map(p => Number(p.value) || 0),
    tension: 0.25,
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}
</script>

<style scoped>
.top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem; }
.title{ color:var(--muted); font-weight:650; }
.chart{ height: 280px; }
</style>
