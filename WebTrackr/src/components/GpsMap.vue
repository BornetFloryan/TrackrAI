<template>
  <div id="map" class="map"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  points: { type: Array, default: () => [] }
})

onMounted(() => {
  const map = L.map('map').setView([48.85, 2.35], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map)

  if (props.points.length > 0) {
    const polyline = L.polyline(props.points, { color: 'red' }).addTo(map)
    map.fitBounds(polyline.getBounds())
  }
})
</script>