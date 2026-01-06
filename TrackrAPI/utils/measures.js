function measuresOf(measures, type) {
    return measures
      .filter(m => m.type === type)
      .map(m => ({
        date: new Date(m.date).getTime(),
        value: Number(m.value),
      }))
      .filter(p => Number.isFinite(p.value))
      .sort((a, b) => a.date - b.date);
  }
  
  function lastOf(measures, type) {
    for (let i = measures.length - 1; i >= 0; i--) {
      if (measures[i].type === type) {
        const v = Number(measures[i].value);
        return Number.isFinite(v) ? v : null;
      }
    }
    return null;
  }
  
  module.exports = {
    measuresOf,
    lastOf,
  };
  