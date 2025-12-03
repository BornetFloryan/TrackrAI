<template>
  <div>
    <h1>Historique</h1>

    <ul>
      <li v-for="(group, day) in grouped" :key="day">
        <router-link :to="`/sessions/${day}`">
          {{ day }} — {{ group.length }} mesures
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useMeasureStore } from '../store/measure.store'

const store = useMeasureStore()

onMounted(async () => await store.fetch())

const grouped = computed(() => {
  const byDay = {}
  store.list.forEach(m => {
    const d = new Date(m.date).toLocaleDateString()
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(m)
  })
  return byDay
})
</script>
