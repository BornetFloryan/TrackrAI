export function getSessionSteps(session, measures = []) {
  const sessionId = String(session?._id ?? session?.sessionMongoId ?? '')

  const stepMeasures = measures
    .filter(measure => {
      return (
        measure.type === 'steps' &&
        String(measure.session?._id ?? measure.session) === sessionId
      )
    })
    .sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  if (stepMeasures.length) {
    const lastMeasure = stepMeasures[stepMeasures.length - 1]
    const value = Number(lastMeasure.value)

    if (Number.isFinite(value)) {
      return Math.max(0, Math.round(value))
    }
  }

  const statsSteps = Number(session?.stats?.steps)

  if (Number.isFinite(statsSteps)) {
    return Math.max(0, Math.round(statsSteps))
  }

  return 0
}