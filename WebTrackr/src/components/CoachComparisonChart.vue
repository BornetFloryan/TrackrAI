<template>
  <div class="card" style="height:360px;">
    <h3 style="margin-bottom:.5rem">
      Comparaison – {{ metrics[metric]?.label ?? 'Performance' }}
    </h3>

    <Line
      v-if="chartData.datasets.length"
      :data="chartData"
      :options="chartOptions"
    />

    <p v-else class="muted">Pas assez de données.</p>
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
  sessions: { type: Array, required: true },
  metric: { type: String, required: true }
})

const COLORS = [
  '#38bdf8',
  '#22c55e',
  '#f97316',
  '#a78bfa',
  '#ef4444',
  '#eab308'
]

const metrics = {
  score: { label: 'Score', get: s => s.score },
  distanceKm: { label: 'Distance (km)', get: s => s.stats?.distanceKm },
  hrAvg: { label: 'FC moyenne', get: s => s.stats?.hrAvg },
  stress: { label: 'Stress', get: s => s.stats?.stress },
  durationMin: { label: 'Durée (min)', get: s => s.durationMin },
  steps: { label: 'Pas', get: s => s.steps }
}

const grouped = computed(() => {
  const map = {}

  for (const s of props.sessions) {
    const name = s.user?.login
    const def = metrics[props.metric]
    if (!name || !def) continue

    const value = def.get(s)
    if (value == null) continue

    if (!map[name]) map[name] = []
    map[name].push({
      date: new Date(s.startDate),
      value
    })
  }

  Object.values(map).forEach(arr =>
    arr.sort((a, b) => a.date - b.date)
  )

  return map
})

const chartData = computed(() => {
  const athletes = Object.keys(grouped.value)
  if (!athletes.length) return { labels: [], datasets: [] }

  const labels = grouped.value[athletes[0]].map(p =>
    p.date.toLocaleDateString()
  )

  return {
    labels,
    datasets: athletes.map((name, i) => {
      const color = COLORS[i % COLORS.length]

      return {
        label: name,
        data: grouped.value[name].map(p => p.value),
        borderColor: color,
        backgroundColor: `${color}33`,
        pointBackgroundColor: color,
        pointBorderColor: '#000',
        pointRadius: 4,
        tension: 0.3
      }
    })
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#e5e7eb'
      }
    }
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
}
</script>
