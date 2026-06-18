<template>
  <div class="page">
    <h1>Sportifs</h1>

    <div class="card">
      <p class="muted">
        Sélectionnez un sportif suivi pour analyser ses performances globales.
      </p>

      <div class="form-row" style="margin-top:.75rem;">
        <select v-model="scope">
          <option value="mine">Mes sportifs</option>
          <option value="all">Tous les sportifs</option>
        </select>
        <input v-model="query" type="text" placeholder="Rechercher par nom ou email…" class="input" />
      </div>
    </div>

    <div class="grid grid-3" style="margin-top:1rem;">
      <div
        v-for="u in filteredAthletes"
        :key="u._id"
        class="card athlete-card"
        :class="{ disabled: !isMine(u) }"
        @click="go(u)"
      >
        <div class="name">
          {{ u.login }}
          <span class="badge" :class="isMine(u) ? 'badge-success' : 'badge-warning'">
            {{ isMine(u) ? 'Suivi par vous' : coachLabel(u) }}
          </span>
        </div>
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

        <button
          v-if="activeSessionFor(u)"
          class="live-button"
          type="button"
          @click.stop="goLive(u)"
        >
          Voir la séance en direct
        </button>

        <div class="hint">
          {{ isMine(u) ? 'Voir le profil →' : 'Non accessible sans affectation' }}
        </div>
      </div>

      <div v-if="!filteredAthletes.length" class="card muted">
        Aucun sportif ne correspond à la recherche.
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user.store'
import { useSessionStore } from '../store/session.store'
import { useAuthStore } from '../store/auth.store'

const router = useRouter()
const userStore = useUserStore()
const sessionStore = useSessionStore()
const auth = useAuthStore()

const query = ref('')
const scope = ref('mine')
const sessions = ref([])
let refreshPoller = null

async function refreshSessions() {
  sessions.value = await sessionStore.fetchHistory()
}

onMounted(async () => {
  await userStore.fetch()
  await refreshSessions()
  refreshPoller = setInterval(refreshSessions, 5000)
})

onUnmounted(() => {
  if (refreshPoller) clearInterval(refreshPoller)
})
const athletes = computed(() =>
  userStore.users.filter(u => u.rights.includes('basic'))
)

const filteredAthletes = computed(() => {
  let list = athletes.value

  if (scope.value === 'mine') {
    list = list.filter(isMine)
  }

  if (!query.value) return list
  const q = query.value.toLowerCase()
  return list.filter(u =>
    u.login?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q)
  )
})

function coachId(user) {
  if (!user?.coach) return ''
  return typeof user.coach === 'object' ? user.coach._id : user.coach
}

function isMine(user) {
  return String(coachId(user)) === String(auth.userId)
}

function coachLabel(user) {
  if (!user?.coach) return 'Aucun coach'
  if (typeof user.coach === 'object') return `Coach : ${user.coach.login || '—'}`
  return 'Autre coach'
}

function sessionUserId(session) {
  return typeof session.user === 'object' ? session.user?._id : session.user
}

function activeSessionFor(user) {
  if (!isMine(user)) return null
  return sessions.value.find(s =>
    String(sessionUserId(s)) === String(user._id) && !s.endDate
  ) || null
}

function goLive(user) {
  const session = activeSessionFor(user)
  if (!session?._id) return
  router.push(`/sessions/${session._id}`)
}

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

function go(user) {
  if (!isMine(user)) return
  router.push(`/coach/athletes/${user._id}`)
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

.athlete-card.disabled {
  cursor: not-allowed;
  opacity: .68;
}

.athlete-card.disabled:hover {
  transform: none;
  border-color: var(--border);
  box-shadow: none;
}

.name {
  font-weight: 900;
  font-size: 1.05rem;
}

.email {
  color: var(--muted);
  font-size: .9rem;
}

.live-button {
  width: 100%;
  margin-top: .75rem;
}

.hint {  margin-top: .4rem;
  font-size: .8rem;
  color: rgba(110, 231, 255, .85);
}

.form-row {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
  max-width: 620px;
}

.form-row > * {
  flex: 1;
  min-width: 220px;
}
</style>



