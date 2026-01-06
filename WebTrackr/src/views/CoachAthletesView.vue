<template>
  <div class="page">
    <h1>Sportifs</h1>

    <div class="card">
      <p class="muted">
        Sélectionnez un sportif pour analyser ses performances globales.
      </p>

      <input v-model="query" type="text" placeholder="Rechercher par nom ou email…" class="input"
        style="margin-top:.75rem; max-width:360px;" />
    </div>

    <div class="grid grid-3" style="margin-top:1rem;">
      <div v-for="u in filteredAthletes" :key="u._id" class="card athlete-card" @click="go(u._id)">
        <div class="name">{{ u.login }}</div>
        <div class="email">{{ u.email }}</div>

        <div v-if="athleteInsights[u._id]" class="insights">
          <p class="muted">
            Score moyen :
            <strong>
              {{ athleteInsights[u._id].avgScore.toFixed(1) }}
            </strong>
          </p>

          <ul class="muted">
            <li>Charge : {{ athleteInsights[u._id].load.toFixed(1) }}</li>
            <li>Intensité : {{ athleteInsights[u._id].intensity.toFixed(1) }}</li>
            <li>Récupération : {{ athleteInsights[u._id].recovery.toFixed(1) }}</li>
          </ul>
        </div>

        <div class="hint">Voir le profil →</div>
      </div>

      <div v-if="!filteredAthletes.length" class="card muted">
        Aucun sportif ne correspond à la recherche.
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user.store'
import { useSessionStore } from '../store/session.store'

const router = useRouter()
const userStore = useUserStore()
const sessionStore = useSessionStore()

const query = ref('')
const sessions = ref([])

onMounted(async () => {
  await userStore.fetch()
  sessions.value = await sessionStore.fetchHistory()
})

const athletes = computed(() =>
  userStore.users.filter(u => u.rights.includes('basic'))
)

const filteredAthletes = computed(() => {
  if (!query.value) return athletes.value
  const q = query.value.toLowerCase()
  return athletes.value.filter(u =>
    u.login?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q)
  )
})

const athleteInsights = computed(() => {
  const map = {}

  for (const s of sessions.value) {
    const userId = s.user?._id
    const score = s.stats?.score

    if (!userId || !score?.components) continue

    if (!map[userId]) {
      map[userId] = {
        count: 0,
        avgScore: 0,
        load: 0,
        intensity: 0,
        recovery: 0
      }
    }

    map[userId].count++
    map[userId].avgScore += score.global
    map[userId].load += score.components.load
    map[userId].intensity += score.components.intensity
    map[userId].recovery += score.components.recovery
  }

  for (const id in map) {
    const v = map[id]
    v.avgScore /= v.count
    v.load /= v.count
    v.intensity /= v.count
    v.recovery /= v.count
  }

  return map
})

function go(userId) {
  router.push(`/coach/athletes/${userId}`)
}
</script>

<style scoped>
.athlete-card {
  cursor: pointer;
  transition: all .18s ease;
  border: 1px solid var(--border);
}

.athlete-card:hover {
  transform: translateY(-2px);
  border-color: rgba(110, 231, 255, .6);
  box-shadow: 0 8px 28px rgba(110, 231, 255, .12);
}

.name {
  font-weight: 900;
  font-size: 1.05rem;
}

.email {
  color: var(--muted);
  font-size: .9rem;
}

.hint {
  margin-top: .4rem;
  font-size: .8rem;
  color: rgba(110, 231, 255, .85);
}
</style>
