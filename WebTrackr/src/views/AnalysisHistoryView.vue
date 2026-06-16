<template>
  <div class="page">
    <h1>Historique des analyses vidéo</h1>

    <div class="card">
      <p class="muted">
        Retrouvez les analyses envoyées par le module vidéo : score, répétitions,
        erreurs détectées et conseils.
      </p>

      <button @click="load" :disabled="loading">
        {{ loading ? 'Chargement…' : 'Rafraîchir' }}
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div v-if="loading" class="card" style="margin-top:1rem;">
      Chargement des analyses…
    </div>

    <div v-else-if="!analyses.length" class="card" style="margin-top:1rem;">
      <p class="muted">
        Aucune analyse stockée pour le moment. Lancez une analyse vidéo pour
        alimenter cet historique.
      </p>
    </div>

    <div v-else class="grid" style="margin-top:1rem;">
      <div v-for="item in analyses" :key="item.analysisId" class="card">
        <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
          <div>
            <h3 style="margin-bottom:.25rem;">
              {{ exerciseLabel(item) }}
            </h3>
            <p class="muted" style="margin:0;">
              {{ new Date(item.date).toLocaleString() }}
            </p>
            <p class="muted mono" style="margin:.35rem 0 0;">
              {{ item.analysisId }}
            </p>
          </div>

          <div class="score">
            {{ scoreOf(item) }}
            <span>/100</span>
          </div>
        </div>

        <div class="grid grid-3" style="margin-top:1rem;">
          <div class="mini">
            <strong>{{ repetitionsOf(item) }}</strong>
            <span>répétition(s)</span>
          </div>
          <div class="mini">
            <strong>{{ errorsOf(item).length }}</strong>
            <span>erreur(s)</span>
          </div>
          <div class="mini">
            <strong>{{ tipsOf(item).length }}</strong>
            <span>conseil(s)</span>
          </div>
        </div>

        <div class="grid grid-2" style="margin-top:1rem;">
          <div>
            <h4>Erreurs détectées</h4>
            <p v-if="!errorsOf(item).length" class="muted">Aucune erreur majeure.</p>
            <ul v-else class="muted">
              <li v-for="err in errorsOf(item)" :key="err">{{ err }}</li>
            </ul>
          </div>

          <div>
            <h4>Conseils</h4>
            <p v-if="!tipsOf(item).length" class="muted">Aucun conseil disponible.</p>
            <ul v-else class="muted">
              <li v-for="tip in tipsOf(item)" :key="tip">{{ tip }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useMeasureStore } from '../store/measure.store'

const measureStore = useMeasureStore()
const loading = ref(false)
const error = ref('')

const analyses = computed(() => measureStore.analyses)

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    await measureStore.fetchAnalyses()
  } catch (e) {
    error.value = e?.message || 'Impossible de charger les analyses vidéo'
  } finally {
    loading.value = false
  }
}

function analysisOf(item) {
  return item.result?.analysis || {}
}

function exerciseLabel(item) {
  return item.result?.exercise || item.type || 'Analyse vidéo'
}

function scoreOf(item) {
  const score = analysisOf(item).score
  return Number.isFinite(score) ? score : '—'
}

function repetitionsOf(item) {
  const reps = analysisOf(item).metrics?.repetitions
  return Number.isFinite(reps) ? reps : 0
}

function errorsOf(item) {
  return analysisOf(item).errors || []
}

function tipsOf(item) {
  return analysisOf(item).tips || []
}
</script>

<style scoped>
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: .8rem;
}

.score {
  min-width: 90px;
  text-align: center;
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--brand);
}

.score span {
  font-size: .85rem;
  color: var(--muted);
}

.mini {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .75rem;
  background: rgba(255,255,255,.03);
}

.mini strong {
  display: block;
  font-size: 1.4rem;
}

.mini span {
  color: var(--muted);
  font-size: .85rem;
}
</style>
