<template>
  <div class="map-wrap">
    <div ref="el" class="map"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  points: { type: Array, default: () => [] }, // [[lat,lon], ...]
})

const el = ref(null)
let map = null
let line = null
let marker = null

function ensureMap() {
  if (map || !el.value) return
  map = L.map(el.value, { zoomControl: true }).setView([48.85, 2.35], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)
}

function renderTrack(points) {
  if (!map) return

  if (line) { line.remove(); line = null }
  if (marker) { marker.remove(); marker = null }

  if (!points || points.length === 0) return

  line = L.polyline(points, { weight: 4 }).addTo(map)
  marker = L.marker(points[points.length - 1]).addTo(map)

  try { map.fitBounds(line.getBounds(), { padding: [20,20] }) } catch {}
}

onMounted(() => {
  ensureMap()
  renderTrack(props.points)
})

watch(() => props.points, (p) => {
  ensureMap()
  renderTrack(p)
}, { deep: true })

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-wrap{ width:100%; }
.map{ height: 420px; border-radius: 14px; overflow:hidden; }
@media (max-width: 820px){
  .map{ height: 360px; }
}
</style>
