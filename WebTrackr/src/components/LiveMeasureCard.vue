<template>
  <div class="live-card">
    <h3>{{ label }}</h3>
    <p class="value">{{ value }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  label: String,
  value: [String, Number]
})
</script>

