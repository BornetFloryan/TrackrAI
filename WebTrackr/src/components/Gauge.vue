<template>
  <div class="card g">
    <div class="label">{{ label }}</div>
    <div class="ring">
      <svg viewBox="0 0 120 120">
        <circle class="bg" cx="60" cy="60" r="46" />
        <circle class="fg" cx="60" cy="60" r="46" :style="{ strokeDashoffset: dashOffset }" />
      </svg>
      <div class="center">
        <div class="val">{{ value }}</div>
        <div class="unit">{{ unit }}</div>
      </div>
    </div>
    <div v-if="hint" class="hint">{{ hint }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: [String, Number],
  unit: String,
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  hint: String,
})

const CIRC = 2 * Math.PI * 46

const ratio = computed(() => {
  const n = Number(props.value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, (n - props.min) / (props.max - props.min)))
})

const dashOffset = computed(() => String(CIRC * (1 - ratio.value)))
</script>

<style scoped>
.g{ display:flex; flex-direction:column; gap:.5rem; align-items:flex-start; }
.label{ color:var(--muted); font-weight:650; font-size:.9rem; }
.ring{ position:relative; width:140px; height:140px; }
svg{ width:140px; height:140px; transform: rotate(-90deg); }
circle{ fill:none; stroke-width: 12; }
.bg{ stroke: rgba(255,255,255,.07); }
.fg{
  stroke: rgba(110,231,255,.85);
  stroke-linecap: round;
  stroke-dasharray: 289;
  transition: stroke-dashoffset .25s ease;
}
.center{
  position:absolute;
  inset:0;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  transform: translateY(2px);
}
.val{ font-weight:900; font-size:1.5rem; }
.unit{ color:var(--muted); font-size:.85rem; margin-top:-2px; }
.hint{ color:var(--muted); font-size:.85rem; }
</style>
