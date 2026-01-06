<template>
    <div class="card" style="height:320px;">
      <h3 style="margin:0 0 .5rem 0;">
        {{ metrics[metric]?.label ?? 'Performance' }}
      </h3>
  
      <Line
        v-if="chartData.datasets[0]?.data.length"
        :data="chartData"
        :options="chartOptions"
      />
  
      <p v-else class="muted">Aucune donnée disponible.</p>
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
    Tooltip
  } from 'chart.js'
  
  ChartJS.register(
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip
  )
  
  const props = defineProps({
    sessions: { type: Array, required: true },
    metric: { type: String, required: true },
    metrics: { type: Object, required: true }
  })
  
  const COLOR = '#22c55e'
  
  const chartData = computed(() => {
    const def = props.metrics[props.metric]
    if (!def) return { labels: [], datasets: [] }
  
    return {
      labels: props.sessions.map(s =>
        new Date(s.start).toLocaleString()
      ),
      datasets: [
        {
          label: def.label,
          data: props.sessions.map(s => def.get(s) ?? null),
          borderColor: COLOR,
          backgroundColor: `${COLOR}33`,
          pointBackgroundColor: COLOR,
          pointRadius: 4,
          tension: 0.3
        }
      ]
    }
  })
  
  const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255,255,255,0.08)' }
      }
    }
  }))
  </script>
  