<template>
  <div class="page">
    <h1>Dashboard</h1>

    <div class="card">
      <div class="grid grid-3">
        <div>
          <label>Période</label>
          <select v-model="days">
            <option :value="1">24h</option>
            <option :value="7">7 jours</option>
            <option :value="14">14 jours</option>
            <option :value="30">30 jours</option>
          </select>
        </div>

        <div style="display:flex; align-items:flex-end;">
          <button @click="reload" :disabled="loading">Analyser</button>
        </div>
      </div>

      <p class="muted" style="margin-top:.75rem">
        Évolution des performances séance par séance.
      </p>
    </div>

    <div v-if="loading" class="card" style="margin-top:1rem;">
      Chargement…
    </div>

    <template v-else>

      <div class="grid grid-3" style="margin-top:1rem;">
        <StatCard title="Distance totale" :value="totalDistanceLabel" />
        <StatCard title="HR moyenne" :value="hrAvgLabel" :sub="`HR max: ${hrMaxLabel}`" />
        <StatCard title="Stress moyen" :value="stressAvgLabel" :sub="`Pas totaux: ${stepsTotalLabel}`" />
      </div>

      <div class="card" style="margin-top:1rem;height:320px;">
        <h3 style="margin:0 0 .5rem 0;">Performance des séances</h3>

        <Line 
        v-if="chartData.datasets[0].data.length" 
        :data="chartData" 
        :options="chartOptions" 
        />

        <p v-else style="color:var(--muted)">Aucune séance sur la période.</p>
      </div>
      <div class="card" style="margin-top:1rem;" v-if="globalGpsPoints.length">
        <h3 style="margin:0 0 .5rem 0;">Tracés GPS cumulés</h3>
        <GpsMap :points="globalGpsPoints" />
      </div>

      <div class="card" style="margin-top:1rem;">
        <h3>Analyse IA (préparée)</h3>
        <ul class="muted">
          <li>Charge d’entraînement</li>
          <li>Tendance de performance</li>
          <li>Détection fatigue / surmenage</li>
          <li>Comparaison inter-séances</li>
        </ul>
      </div>

    </template>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip
  } from 'chart.js'
  
  ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip)
  
  import { useModuleStore } from '../store/module.store'
  import { useSessionStore } from '../store/session.store'
  
  import StatCard from '../components/StatCard.vue'
  import GpsMap from '../components/GpsMap.vue'
  
  const router = useRouter()
  const moduleStore = useModuleStore()
  const sessionStore = useSessionStore()
  
  const days = ref(7)
  const loading = ref(false)
  const sessions = ref([])
  const globalGpsPoints = ref([])
  
  onMounted(async () => {
    await moduleStore.fetch()
    await reload()
  })
  
  async function reload() {
    loading.value = true
    try {
      let list = await sessionStore.fetchHistory()
  
      const minDate = Date.now() - days.value * 24 * 3600 * 1000
      list = list
        .filter(s => new Date(s.startDate).getTime() >= minDate)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

  
      sessions.value = list.map(s => ({
        sessionMongoId: s._id,
        start: s.startDate,
        distanceKm: s.stats?.distanceKm,
        hrAvg: s.stats?.hrAvg,
        hrMax: s.stats?.hrMax,
        steps: s.stats?.steps,
        stress: s.stats?.stress,
        score: s.stats?.score,
      }))
  
      globalGpsPoints.value = []
    } finally {
      loading.value = false
    }
  }
  
  const chartData = computed(() => ({
    labels: sessions.value.map(s =>
      new Date(s.start).toLocaleString()
    ),
    datasets: [{
      data: sessions.value.map(s => s.score ?? 0),
      borderColor: '#6ee7ff',
      backgroundColor: 'rgba(110,231,255,.25)',
      tension: 0.3,
    }]
  }))

  
  const totalDistanceLabel = computed(() =>
    `${sessions.value.reduce((a, s) => a + (s.distanceKm ?? 0), 0).toFixed(2)} km`
  )
  const hrAvgLabel = computed(() => {
    const v = sessions.value.map(s => s.hrAvg).filter(Boolean)
    return v.length ? `${Math.round(v.reduce((a,b)=>a+b,0)/v.length)} bpm` : '—'
  })
  const hrMaxLabel = computed(() => {
    const v = sessions.value.map(s => s.hrMax).filter(Boolean)
    return v.length ? `${Math.max(...v)} bpm` : '—'
  })
  const stepsTotalLabel = computed(() =>
    `${sessions.value.reduce((a,s)=>a+(s.steps??0),0)}`
  )
  const stressAvgLabel = computed(() => {
    const v = sessions.value.map(s => s.stress).filter(Boolean)
    return v.length ? `${Math.round(v.reduce((a,b)=>a+b,0)/v.length)}/100` : '—'
  })

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    },
    onClick: (evt, elements) => {
      if (!elements.length) return

      const idx = elements[0].index
      const session = sessions.value[idx]

      if (session?.sessionMongoId) {
        router.push(`/sessions/${session.sessionMongoId}`)
      }
    }
  }

</script>  
