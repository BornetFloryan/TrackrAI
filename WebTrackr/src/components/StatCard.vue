<template>
  <div class="card stat">
    <div class="top">
      <div class="title">{{ title }}</div>
      <span v-if="badge" class="badge">{{ badge }}</span>
    </div>
    <div class="value">{{ value }}</div>
    <div v-if="sub" class="sub">{{ sub }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  sub: String,
  badge: String,
})
</script>

<style scoped>
.stat{ padding: 1rem; }
.top{ display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
.title{ color: var(--muted); font-weight:650; font-size:.9rem; }
.value{ font-size: 2rem; font-weight: 900; margin-top:.45rem; }
.sub{ color: var(--muted); font-size:.9rem; margin-top:.25rem; }
</style>
