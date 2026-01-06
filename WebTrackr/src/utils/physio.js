export function movingAverage(series, window = 5) {
  return series.map((p, i, arr) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1)
    const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length
    return { ...p, value: avg }
  })
}

// Pas estimés: détection de pics sur magnitude d'accélération
export function estimateSteps(accX, accY, accZ, threshold = 16000) {
  accX = movingAverage(accX)
  accY = movingAverage(accY)
  accZ = movingAverage(accZ)

  const merged = mergeByTime(accX, accY, accZ)
  if (merged.length < 5) return 0

  let steps = 0
  let above = false

  for (const p of merged) {
    const mag = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z)

    if (!above && mag > threshold) {
      steps++
      above = true
    }
    if (above && mag < threshold * 0.85) {
      above = false
    }
  }

  return steps
}

function mergeByTime(x, y, z) {
  const map = new Map()
  for (const p of x) { map.set(p.date, { t:p.date, x:p.value }) }
  for (const p of y) {
    const o = map.get(p.date) || { t:p.date }
    o.y = p.value
    map.set(p.date, o)
  }
  for (const p of z) {
    const o = map.get(p.date) || { t:p.date }
    o.z = p.value
    map.set(p.date, o)
  }
  return [...map.values()]
    .filter(o => Number.isFinite(o.x) && Number.isFinite(o.y) && Number.isFinite(o.z))
    .sort((a,b)=>a.t-b.t)
    .map(o => ({ t:o.t, x:o.x, y:o.y, z:o.z }))
}

// Stress: si rmssd dispo -> inverse (rmssd bas => stress haut)
// sinon proxy simple à partir HR (bpm élevé => stress ↑)
export function estimateStress({ rmssd, hr }) {
  if (Number.isFinite(rmssd) && rmssd > 0) {
    // rmssd typiquement 10..120, on map vers 0..100
    const x = clamp((120 - rmssd) / 110, 0, 1)
    return Math.round(x * 100)
  }
  if (Number.isFinite(hr) && hr > 0) {
    // 50..190 -> 0..100
    const x = clamp((hr - 55) / 135, 0, 1)
    return Math.round(x * 100)
  }
  return null
}
function clamp(v,a,b){ return Math.max(a, Math.min(b,v)) }
