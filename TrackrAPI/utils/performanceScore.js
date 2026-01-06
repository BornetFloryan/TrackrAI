function computePerformanceScore({ distanceKm, hrAvg, stress }) {
    const distanceScore = Math.min(40, (distanceKm ?? 0) * 15)
    const hrScore = Math.min(30, Math.max(0, ((hrAvg ?? 0) - 90) * 0.5))
    const stressPenalty = Math.min(30, (stress ?? 0) * 0.3)
  
    return Math.round(distanceScore + hrScore - stressPenalty)
  }
  
  module.exports = { computePerformanceScore }
  