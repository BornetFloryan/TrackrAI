import { buildGpsTrack, measuresOf } from './measureAdapters'
import { haversineKm } from './geo'
import { estimateSteps, estimateStress } from './physio'

export function groupSessionsFromMeasures(measures) {
  const bySession = new Map()

  for (const m of measures) {
    const sid = m.session // Mongo ObjectId string
    if (!sid) continue
    if (!bySession.has(sid)) bySession.set(sid, [])
    bySession.get(sid).push(m)
  }

  const sessions = []
  for (const [sessionMongoId, list] of bySession.entries()) {
    list.sort((a,b)=> new Date(a.date) - new Date(b.date))
    const start = new Date(list[0].date)
    const end = new Date(list[list.length - 1].date)
    const durationMs = end.getTime() - start.getTime()

    const track = buildGpsTrack(list)
    const gpsPts = track.map(p => [p.lat, p.lon])

    let dist = 0
    for (let i = 1; i < gpsPts.length; i++) {
      const d = haversineKm(gpsPts[i-1], gpsPts[i])
      if (d > 0.003) { // ignore < 3m
        dist += d
      }
    }

    const hrSeries = measuresOf(list, 'heart_rate')
    const speeds = measuresOf(list, 'gps_speed')

    const hrAvg = avg(hrSeries.map(x=>x.value).filter(v=>v>0))
    const hrMax = max(hrSeries.map(x=>x.value).filter(v=>v>0))

    const speedAvg = avg(
      speeds.map(x => x.value).filter(v => v >= 0.5)
    )
    const speedMax = max(speeds.map(x=>x.value))

    const ax = measuresOf(list, 'acc_x')
    const ay = measuresOf(list, 'acc_y')
    const az = measuresOf(list, 'acc_z')
    const steps = estimateSteps(ax, ay, az)

    const rmssd = lastOf(list, 'rmssd')
    const stress = estimateStress({ rmssd, hr: hrAvg })

    const moduleId = list[0].module || null

    sessions.push({
      sessionMongoId,
      moduleId,
      start,
      end,
      durationMs,
      distanceKm: dist,
      hrAvg,
      hrMax,
      speedAvgMs: speedAvg,
      speedMaxMs: speedMax,
      steps,
      stress,
    })
  }

  // tri desc (récent d'abord)
  sessions.sort((a,b)=> b.start - a.start)
  return sessions
}

function lastOf(list, type) {
  for (let i=list.length-1;i>=0;i--) {
    if (list[i].type === type) {
      const n = Number(list[i].value)
      return Number.isFinite(n) ? n : null
    }
  }
  return null
}
function avg(arr){ if(!arr.length) return null; return arr.reduce((a,b)=>a+b,0)/arr.length }
function max(arr){ if(!arr.length) return null; return Math.max(...arr) }
