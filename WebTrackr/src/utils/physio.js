export function movingAverage(series, window = 5) {
  return series.map((p, i, arr) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length;
    return { ...p, value: avg };
  });
}

export function estimateSteps(accX, accY, accZ) {
  const merged = mergeByTime(
    movingAverage(accX, 3),
    movingAverage(accY, 3),
    movingAverage(accZ, 3)
  );

  if (merged.length < 6) return 0;

  const magnitudes = merged.map((p) => ({
    t: p.t,
    value: Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z),
  }));

  const baseline = median(magnitudes.map((p) => p.value));
  const centered = magnitudes.map((p) => ({ ...p, value: Math.abs(p.value - baseline) }));
  const noise = median(centered.map((p) => p.value));
  const maxPeak = Math.max(...centered.map((p) => p.value));
  const threshold = Math.max(noise * 2.2, maxPeak * 0.28, 8);
  const release = threshold * 0.55;

  let steps = 0;
  let armed = true;
  let lastStepT = 0;

  for (const p of centered) {
    if (armed && p.value >= threshold && p.t - lastStepT > 280) {
      steps++;
      lastStepT = p.t;
      armed = false;
    }

    if (!armed && p.value <= release) {
      armed = true;
    }
  }

  return steps;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mergeByTime(x, y, z) {
  const map = new Map();
  for (const p of x) {
    map.set(p.date, { t: p.date, x: p.value });
  }
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
      (o) =>
        Number.isFinite(o.x) && Number.isFinite(o.y) && Number.isFinite(o.z)
    )
    .sort((a, b) => a.t - b.t)
    .map((o) => ({ t: o.t, x: o.x, y: o.y, z: o.z }));
}

export function estimateStress({ rmssd, hr }) {
  if (Number.isFinite(rmssd) && rmssd > 0) {
    const ln = Math.log(rmssd);

    const LN_LOW = Math.log(15);
    const LN_HIGH = Math.log(60);

    const x = clamp((LN_HIGH - ln) / (LN_HIGH - LN_LOW), 0, 1);

    return Math.round(20 + x * 60);
  }

  if (Number.isFinite(hr) && hr > 0) {
    const x = clamp((hr - 60) / 60, 0, 1);
    return Math.round(30 + x * 50);
  }

  return null;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}