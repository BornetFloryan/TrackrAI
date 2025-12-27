<template>
  <div class="card comp">
    <div class="head">
      <div class="t">Direction</div>
      <span class="badge">{{ headingLabel }}</span>
    </div>

    <div class="dial">
      <div
        v-if="heading != null"
        class="needle"
        :style="{ transform: `translate(-50%, -100%) rotate(${heading}deg)` }"
      ></div>

      <div v-else class="no-signal">—</div>

      <div class="dot"></div>
      <div class="north">N</div>
    </div>

    <div class="muted" v-if="sub">{{ sub }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  heading: { type: Number, default: null }, // null si pas de direction
  sub: String,
})

const headingLabel = computed(() => {
  if (props.heading == null) return '—'
  return `${Math.round(props.heading)}°`
})
</script>

<style scoped>
.comp { display:flex; flex-direction:column; gap:.6rem; }
.head { display:flex; align-items:center; justify-content:space-between; }
.t { color:var(--muted); font-weight:650; font-size:.9rem; }

.dial{
  position:relative;
  width:180px;
  height:180px;
  border-radius:999px;
  border:1px solid var(--border);
  background: rgba(255,255,255,.03);
  overflow:hidden;
  margin-top:.25rem;
  display:flex;
  align-items:center;
  justify-content:center;
}

.needle{
  position:absolute;
  width:2px;
  height:86px;
  left:50%;
  top:50%;
  transform-origin: bottom center;
  background: linear-gradient(180deg, rgba(255,92,122,.95), rgba(255,92,122,.12));
}

.no-signal{
  font-size:2rem;
  color: rgba(255,255,255,.35);
}

.dot{
  position:absolute;
  width:10px; height:10px;
  border-radius:999px;
  background: rgba(110,231,255,.85);
  left:50%; top:50%;
  translate:-50% -50%;
}
.north{
  position:absolute;
  top:10px; left:50%;
  translate:-50% 0;
  font-weight:900;
  color: rgba(110,231,255,.9);
}
.muted{ color:var(--muted); font-size:.85rem; }
</style>
