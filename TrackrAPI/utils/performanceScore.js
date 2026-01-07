function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x))
}

function computePerformanceScore({ durationMs, distanceKm, hrAvg, stress, rmssd }) {
  const durMin = (durationMs ?? 0) / 60000
  const dist = Number.isFinite(distanceKm) ? distanceKm : 0
  const hr = Number.isFinite(hrAvg) ? hrAvg : null
  const st = Number.isFinite(stress) ? stress : null

  const load = clamp((dist / Math.max(0.01, durMin / 60)) * 12, 0, 100)
  const intensity = hr == null ? null : clamp(((hr - 80) / (180 - 80)) * 100, 0, 100)
  const recovery = st == null ? null : clamp(100 - st, 0, 100)

  const wLoad = 0.45
  const wIntensity = 0.45
  const wRecovery = 0.10

  let wSum = 0
  let total = 0

  if (Number.isFinite(load)) { total += wLoad * load; wSum += wLoad }
  if (intensity != null) { total += wIntensity * intensity; wSum += wIntensity }
  if (recovery != null) { total += wRecovery * recovery; wSum += wRecovery }

  const confidence = clamp(wSum / (wLoad + wIntensity + wRecovery), 0, 1)
  const global = wSum > 0 ? clamp(total / wSum, 0, 100) : null

  return {
    global,
    confidence,
    components: {
      load: Number.isFinite(load) ? Math.round(load) : null,
      intensity: intensity == null ? null : Math.round(intensity),
      recovery: recovery == null ? null : Math.round(recovery),
    },
    weights: { wLoad, wIntensity, wRecovery },
    meta: {
      durationMin: Math.round(durMin * 100) / 100,
      distanceKm: Math.round(dist * 100) / 100,
      hrAvg: hr == null ? null : Math.round(hr),
      stress: st == null ? null : Math.round(st),
      rmssd: Number.isFinite(rmssd) ? Math.round(rmssd * 10) / 10 : null,
    }
  }
}

module.exports = { computePerformanceScore }
