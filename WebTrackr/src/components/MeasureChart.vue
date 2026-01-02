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
  Tooltip, Legend,
  Filler
} from 'chart.js'
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler)

const COLORS = {
  heart_rate: {
    line: '#ff5c7a',
    fill: 'rgba(255,92,122,.18)',
    point: '#ff9db1',
  },
  rmssd: {
    line: '#34d399',
    fill: 'rgba(52,211,153,.18)',
    point: '#6ee7b7',
  },
  gps_speed: {
    line: '#a78bfa',
    fill: 'rgba(167,139,250,.18)',
    point: '#c4b5fd',
  },
  default: {
    line: '#6ee7ff',
    fill: 'rgba(110,231,255,.15)',
    point: '#a78bfa',
  }
}

const props = defineProps({
  title: { type: String, default: 'Mesure' },
  unit: { type: String, default: '' },
  type: { type: String, default: 'default' },
  series: { type: Array, default: () => [] },
})

const theme = computed(() => COLORS[props.type] ?? COLORS.default)

const chartData = computed(() => ({
  labels: props.series.map(p =>
    new Date(p.date).toLocaleTimeString()
  ),
  datasets: [{
    label: props.title,
    data: props.series.map(p => Number(p.value) || 0),

    borderColor: theme.value.line,
    backgroundColor: theme.value.fill,
    borderWidth: 2,
    fill: true,

    pointRadius: 4,
    pointHoverRadius: 10,
    pointHitRadius: 20,
    hoverBorderWidth: 2,

    pointBackgroundColor: theme.value.point,
    pointBorderColor: '#0b1220',



    tension: 0.3,
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },

  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f1a2f',
      titleColor: '#e7eefc',
      bodyColor: '#e7eefc',
      borderColor: 'rgba(255,255,255,.12)',
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#9fb0d0',
        maxRotation: 0,
      },
      grid: {
        color: 'rgba(255,255,255,.04)',
      }
    },
    y: {
      ticks: {
        color: '#9fb0d0',
      },
      grid: {
        color: 'rgba(255,255,255,.04)',
      }
    }
  },
}
</script>

<style scoped>
.top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem; }
.title{ color:var(--muted); font-weight:650; }
.chart{ height: 280px; padding-bottom: 12px; }
</style>
