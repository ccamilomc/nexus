import { seriesTotal, toDateKey, toDateKeyFromIso } from '@/shared/utils'

import type { SessionSample, VolumeSetSample, WorkoutPeriodSeries } from '../types/workout.types'
import { countWorkingSets, sessionDurationMinutes, sumVolume } from './session-stats'

/** Cifras de una sesión ya resuelta, situada en su día. */
interface DaySession {
  readonly dateKey: string
  readonly volumeKg: number
  readonly setCount: number
  readonly durationMinutes: number | null
}

/**
 * Arma la serie de entrenamiento de un periodo y las cifras del tramo anterior.
 *
 * Recibe las sesiones de **los dos tramos juntos** —una sola consulta, porque
 * son contiguos— junto a todas sus series, y las reparte por día.
 */
export function buildWorkoutSeries(
  sessions: readonly SessionSample[],
  sets: readonly VolumeSetSample[],
  days: readonly Date[],
  previousDays: readonly Date[],
): WorkoutPeriodSeries {
  const setsBySession = groupBySession(sets)
  const daySessions = sessions.map<DaySession>((session) => {
    const sessionSets = setsBySession.get(session.id) ?? []

    return {
      dateKey: toDateKeyFromIso(session.started_at),
      volumeKg: sumVolume(sessionSets),
      // Las de calentamiento no cuentan, igual que no cuentan para el volumen
      // que va justo encima: son la misma pregunta contada dos veces.
      setCount: countWorkingSets(sessionSets),
      durationMinutes: sessionDurationMinutes(session),
    }
  })

  const current = summarize(daySessions, days)
  const previous = summarize(daySessions, previousDays)

  return {
    volumePoints: current.points,
    sessionCount: current.sessionCount,
    previousSessionCount: previous.sessionCount,
    totalVolumeKg: round(seriesTotal(current.points)),
    previousTotalVolumeKg: round(seriesTotal(previous.points)),
    setCount: current.setCount,
    daysTrained: current.daysTrained,
    averageDurationMinutes: current.averageDurationMinutes,
    previousAverageDurationMinutes: previous.averageDurationMinutes,
  }
}

/** Cifras de un tramo concreto a partir de todas las sesiones cargadas. */
function summarize(daySessions: readonly DaySession[], days: readonly Date[]) {
  const inPeriod = new Set(days.map(toDateKey))
  const sessions = daySessions.filter(({ dateKey }) => inPeriod.has(dateKey))

  const volumeByDate = new Map<string, number>()
  for (const { dateKey, volumeKg } of sessions) {
    volumeByDate.set(dateKey, (volumeByDate.get(dateKey) ?? 0) + volumeKg)
  }

  // Los días sin entrenar entran como cero, no como hueco: aquí la ausencia de
  // registro sí es información (ver `WorkoutPeriodSeries`).
  const points = days.map((day) => {
    const dateKey = toDateKey(day)

    return { dateKey, value: round(volumeByDate.get(dateKey) ?? 0) }
  })

  const durations = sessions.reduce<number[]>((collected, { durationMinutes }) => {
    if (durationMinutes !== null) collected.push(durationMinutes)

    return collected
  }, [])

  return {
    points,
    sessionCount: sessions.length,
    setCount: sessions.reduce((total, { setCount }) => total + setCount, 0),
    daysTrained: volumeByDate.size,
    averageDurationMinutes:
      durations.length === 0
        ? null
        : Math.round(durations.reduce((total, minutes) => total + minutes, 0) / durations.length),
  }
}

function groupBySession(sets: readonly VolumeSetSample[]): Map<string, VolumeSetSample[]> {
  const bySession = new Map<string, VolumeSetSample[]>()

  for (const set of sets) {
    const current = bySession.get(set.session_id)
    if (current) current.push(set)
    else bySession.set(set.session_id, [set])
  }

  return bySession
}

/** Dos decimales, para no arrastrar el ruido de la coma flotante al sumar. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}
