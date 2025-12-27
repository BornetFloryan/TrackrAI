export function haversineKm(a, b) {
  const [lat1, lon1] = a
  const [lat2, lon2] = b
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLon / 2)
  const aa = s1*s1 + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*s2*s2
  return 2 * R * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa))
}

export function deg2rad(d){ return d * Math.PI / 180 }
export function rad2deg(r){ return r * 180 / Math.PI }

export function bearingDeg(from, to) {
  const [lat1, lon1] = from.map(deg2rad)
  const [lat2, lon2] = to.map(deg2rad)
  const dLon = lon2 - lon1

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1)*Math.sin(lat2) -
    Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon)

  const brng = rad2deg(Math.atan2(y, x))
  return (brng + 360) % 360
}

// ===============================
// FILTRAGE GPS (anti-bruit)
// ===============================
export function filterGpsTrack(track, {
  minDistanceM = 3
} = {}) {
  const out = []
  let last = null

  for (const p of track) {
    if (!last) {
      out.push(p)
      last = p
      continue
    }

    const dKm = haversineKm([last.lat, last.lon], [p.lat, p.lon])
    if (dKm * 1000 < minDistanceM) continue

    out.push(p)
    last = p
  }
  return out
}
