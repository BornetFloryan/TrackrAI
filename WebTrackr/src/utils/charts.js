export function toChartSeries(measures, type) {
    return measures
      .filter(m => m.type === type)
      .map(m => ({
        date: new Date(m.date),
        value: Number(m.value),
      }))
      .filter(p => Number.isFinite(p.value));
  }
  