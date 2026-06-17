function movingAverage(series, window = 5) {
    return series.map((p, i, arr) => {
      const slice = arr.slice(
        Math.max(0, i - window + 1),
        i + 1
      );
      const avg =
        slice.reduce((s, x) => s + x.value, 0) /
        slice.length;
      return { ...p, value: avg };
    });
  }

  function estimateSteps(accX, accY, accZ, threshold = null) {
    accX = movingAverage(accX);
    accY = movingAverage(accY);
    accZ = movingAverage(accZ);

    const merged = mergeByTime(accX, accY, accZ);
    if (merged.length < 5) return 0;

    const mags = merged.map(p => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z));
    const baseline = median(mags);
    const deviations = mags.map(v => Math.abs(v - baseline));
    const dynamicThreshold = threshold || baseline + Math.max(900, median(deviations) * 2.2);
    const resetThreshold = baseline + Math.max(450, median(deviations) * 1.1);

    let steps = 0;
    let above = false;
    let lastStepT = null;

    for (let i = 0; i < merged.length; i++) {
      const p = merged[i];
      const mag = mags[i];

      const t = Number(new Date(p.t));
      const enoughDelay = !lastStepT || t - lastStepT > 250;

      if (!above && enoughDelay && mag > dynamicThreshold) {
        steps++;
        above = true;
        lastStepT = t;
      }
      if (above && mag < resetThreshold) {
        above = false;
      }
    }
    return steps;
  }

  function stepQuality(accX, accY, accZ) {
    const merged = mergeByTime(
      movingAverage(accX),
      movingAverage(accY),
      movingAverage(accZ)
    );

    if (merged.length < 20) {
      return {
        level: 'low',
        confidence: 20,
        message: 'Peu de donnees accelerometre',
      };
    }

    const mags = merged.map(p => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z));
    const baseline = median(mags);
    const deviations = mags.map(v => Math.abs(v - baseline));
    const signal = median(deviations);

    const confidence = Math.round(clamp((signal - 250) / 1800, 0.15, 0.9) * 100);
    const level = confidence >= 70 ? 'high' : confidence >= 45 ? 'medium' : 'low';

    return {
      level,
      confidence,
      message: level === 'high'
        ? 'Comptage de pas exploitable'
        : level === 'medium'
          ? 'Comptage de pas approximatif'
          : 'Comptage de pas peu fiable',
    };
  }

  function estimateStress({ rmssd, hr }) {
    if (Number.isFinite(rmssd) && rmssd > 0) {
      const ln = Math.log(rmssd);

      const LN_LOW  = Math.log(15);
      const LN_HIGH = Math.log(60);

      const x = clamp(
        (LN_HIGH - ln) / (LN_HIGH - LN_LOW),
        0,
        1
      );

      return Math.round(20 + x * 60);
    }

    if (Number.isFinite(hr) && hr > 0) {
      const x = clamp((hr - 60) / 60, 0, 1);
      return Math.round(30 + x * 50);
    }

    return null;
  }

  function mergeByTime(x, y, z) {
    const map = new Map();

    for (const p of x)
      map.set(p.date, { t: p.date, x: p.value });

    for (const p of y) {
      const o = map.get(p.date) || { t: p.date };
      o.y = p.value;
      map.set(p.date, o);
    }

    for (const p of z) {
      const o = map.get(p.date) || { t: p.date };
      o.z = p.value;
      map.set(p.date, o);
    }

    return [...map.values()]
      .filter(
        o =>
          Number.isFinite(o.x) &&
          Number.isFinite(o.y) &&
          Number.isFinite(o.z)
      )
      .sort((a, b) => a.t - b.t)
      .map(o => ({
        t: o.t,
        x: o.x,
        y: o.y,
        z: o.z,
      }));
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function median(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  module.exports = {
    estimateSteps,
    stepQuality,
    estimateStress,
  };

