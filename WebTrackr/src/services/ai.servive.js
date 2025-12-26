export default {
    async analyzeSession(session) {
      // Mock intelligent basé sur la durée
      const durationMin = Math.floor((session.duration || 0) / 60000)
  
      let fatigue = Math.min(100, Math.max(20, durationMin * 2))
      let level = 'Faible'
      let advice = 'Bonne récupération.'
  
      if (fatigue > 60) {
        level = 'Modéré'
        advice = 'Pense à bien t’hydrater et à t’étirer.'
      }
      if (fatigue > 80) {
        level = 'Élevé'
        advice = 'Repos recommandé avant la prochaine séance.'
      }
  
      return Promise.resolve({
        fatigue,
        level,
        advice,
      })
    },
  }
  