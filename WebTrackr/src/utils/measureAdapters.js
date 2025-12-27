import { filterGpsTrack } from './geo'

export function lastValue(measures, type) {
  for (let i = measures.length - 1; i >= 0; i--) {
    if (measures[i].type === type) {
      const v = Number(measures[i].value)
      if (Number.isFinite(v) && v > 0) return v
    }
  }
  return null
}

export function measuresOf(measures, type) {
  return measures
    .filter(m => m.type === type)
    .map(m => ({ date: new Date(m.date).getTime(), value: Number(m.value) }))
    .filter(p => Number.isFinite(p.value))
    .sort((a,b) => a.date - b.date)
}

export function buildGpsTrack(measures) {
  const lat = measuresOf(measures, 'gps_lat')
  const lon = measuresOf(measures, 'gps_lon')

  const byT = new Map()

  for (const p of lat) {
    if (!byT.has(p.date)) byT.set(p.date, {})
    byT.get(p.date).lat = p.value
  }
  for (const p of lon) {
    if (!byT.has(p.date)) byT.set(p.date, {})
    byT.get(p.date).lon = p.value
  }

  const raw = []
  for (const [t, o] of [...byT.entries()].sort((a,b)=>a[0]-b[0])) {
    if (Number.isFinite(o.lat) && Number.isFinite(o.lon)) {
      raw.push({ t, lat: o.lat, lon: o.lon })
    }
  }

  return filterGpsTrack(raw)
}

export function toChartSeries(measures, type) {
  return measuresOf(measures, type).map(p => ({ date: new Date(p.date), value: p.value }))
}
