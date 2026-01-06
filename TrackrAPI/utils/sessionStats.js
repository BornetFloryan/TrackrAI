const { haversineKm, filterGpsTrack } = require('./geo')
const { measuresOf, lastOf } = require('./measures')
const { estimateSteps, estimateStress } = require('./physio')
const { computePerformanceScore } = require('./performanceScore')

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
}
function max(arr) {
  return arr.length ? Math.max(...arr) : null
}

function computeSessionStats(measures) {
  if (!measures || !measures.length) return null

  measures.sort((a, b) => new Date(a.date) - new Date(b.date))

  const startMs = +new Date(measures[0].date)
  const endMs = +new Date(measures[measures.length - 1].date)
  const durationMs = Math.max(0, endMs - startMs)

  const lat = measuresOf(measures, 'gps_lat')
  const lon = measuresOf(measures, 'gps_lon')

  const byT = new Map()
  for (const p of lat) byT.set(+new Date(p.date), { lat: Number(p.value) })
  for (const p of lon) {
    const t = +new Date(p.date)
    const o = byT.get(t) || {}
    o.lon = Number(p.value)
    byT.set(t, o)
  }

  const rawTrack = [...byT.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, o]) => ({ t, ...o }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon))

  const track = filterGpsTrack(rawTrack)

  let distanceKm = 0
  for (let i = 1; i < track.length; i++) {
    distanceKm += haversineKm([track[i - 1].lat, track[i - 1].lon], [track[i].lat, track[i].lon])
  }

  const hrVals = measuresOf(measures, 'heart_rate')
    .map(p => Number(p.value))
    .filter(v => Number.isFinite(v) && v > 0)

  const hrAvg = avg(hrVals)
  const hrMax = max(hrVals)

  const steps = estimateSteps(
    measuresOf(measures, 'acc_x'),
    measuresOf(measures, 'acc_y'),
    measuresOf(measures, 'acc_z')
  )

  const rmssdRaw = lastOf(measures, 'rmssd')
  const rmssd = rmssdRaw != null ? Number(rmssdRaw) : null
  const stress = estimateStress({ rmssd, hr: hrAvg })

  const score = computePerformanceScore({ durationMs, distanceKm, hrAvg, stress, rmssd })

  return {
    durationMs,
    distanceKm,
    steps,
    hrAvg,
    hrMax,
    stress,
    rmssd,
    score,
    aiScore: null,
  }
}

module.exports = { computeSessionStats }
