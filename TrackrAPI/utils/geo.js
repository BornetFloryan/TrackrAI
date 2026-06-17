function deg2rad(d) {
    return d * Math.PI / 180;
  }

  function rad2deg(r) {
    return r * 180 / Math.PI;
  }

  function haversineKm(a, b) {
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const R = 6371;

    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLon / 2);

    const aa =
      s1 * s1 +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        s2 * s2;

    return 2 * R * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  }

  function bearingDeg(from, to) {
    const [lat1, lon1] = from.map(deg2rad);
    const [lat2, lon2] = to.map(deg2rad);
    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const brng = rad2deg(Math.atan2(y, x));
    return (brng + 360) % 360;
  }

  function filterGpsTrack(track, {
    minDistanceM = 3,
    maxSpeedKmh = 35,
    maxJumpM = 80,
  } = {}) {
    const out = [];
    let last = null;

    for (const p of track) {
      if (!last) {
        out.push(p);
        last = p;
        continue;
      }

      const dKm = haversineKm(
        [last.lat, last.lon],
        [p.lat, p.lon]
      );

      const dtMs = Number(p.t) - Number(last.t);
      const dtHours = dtMs > 0 ? dtMs / 3600000 : null;
      const speedKmh = dtHours ? dKm / dtHours : 0;

      if (dKm * 1000 < minDistanceM) continue;
      if (dKm * 1000 > maxJumpM) continue;
      if (dtHours && speedKmh > maxSpeedKmh) continue;

      out.push(p);
      last = p;
    }
    return out;
  }

  function gpsQuality(rawTrack, filteredTrack) {
    const rawCount = rawTrack.length;
    const keptCount = filteredTrack.length;

    if (rawCount < 3) {
      return {
        level: 'low',
        confidence: 0,
        rawPoints: rawCount,
        keptPoints: keptCount,
        message: 'Trace GPS insuffisante',
      };
    }

    const ratio = keptCount / rawCount;
    const confidence = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    const level = confidence >= 75 ? 'high' : confidence >= 45 ? 'medium' : 'low';

    return {
      level,
      confidence,
      rawPoints: rawCount,
      keptPoints: keptCount,
      message: level === 'high'
        ? 'Trace GPS exploitable'
        : level === 'medium'
          ? 'Trace GPS partiellement bruitée'
          : 'Trace GPS peu fiable',
    };
  }

  module.exports = {
    haversineKm,
    bearingDeg,
    filterGpsTrack,
    gpsQuality,
  };

