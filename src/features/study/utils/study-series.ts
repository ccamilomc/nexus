import { seriesTotal, toDateKey, toDateKeyFromIso } from '@/shared/utils'

import type { StudyPeriodSeries, StudySessionWithSubject } from '../types/study.types'

/**
 * Arma la serie de estudio de un periodo y las cifras del tramo anterior.
 *
 * Como en entrenamiento, **un día sin sesión vale cero, no es un hueco**: una
 * sesión se registra al estudiar (o con el cronómetro), así que no haberla
 * apuntado significa no haber estudiado. El sueño se anota a posteriori y por
 * eso allí sí se respetan los olvidos.
 */
export function buildStudySeries(
  sessions: readonly StudySessionWithSubject[],
  days: readonly Date[],
  previousDays: readonly Date[],
): StudyPeriodSeries {
  const current = summarize(sessions, days)
  const previous = summarize(sessions, previousDays)

  return {
    points: current.points,
    totalMinutes: current.totalMinutes,
    previousTotalMinutes: previous.totalMinutes,
    daysStudied: current.daysStudied,
    previousDaysStudied: previous.daysStudied,
    averageMinutesPerStudiedDay: current.averagePerStudiedDay,
    previousAverageMinutesPerStudiedDay: previous.averagePerStudiedDay,
    topSubject: current.topSubject,
  }
}

function summarize(sessions: readonly StudySessionWithSubject[], days: readonly Date[]) {
  const inPeriod = new Set(days.map(toDateKey))

  const minutesByDate = new Map<string, number>()
  const minutesBySubject = new Map<string, { name: string; minutes: number }>()

  for (const session of sessions) {
    const dateKey = toDateKeyFromIso(session.started_at)
    if (!inPeriod.has(dateKey)) continue

    minutesByDate.set(dateKey, (minutesByDate.get(dateKey) ?? 0) + session.duration_minutes)

    // Las sesiones sin materia se agrupan aparte: estudiar «algo» sigue siendo
    // tiempo estudiado y no puede desaparecer del total por no clasificarse.
    const key = session.subject?.id ?? 'sin-materia'
    const name = session.subject?.name ?? 'Sin materia'
    const current = minutesBySubject.get(key)
    minutesBySubject.set(key, {
      name,
      minutes: (current?.minutes ?? 0) + session.duration_minutes,
    })
  }

  const points = days.map((day) => {
    const dateKey = toDateKey(day)

    return { dateKey, value: minutesByDate.get(dateKey) ?? 0 }
  })

  const daysStudied = minutesByDate.size
  const totalMinutes = seriesTotal(points)

  const ranked = [...minutesBySubject.values()].sort((a, b) => b.minutes - a.minutes)
  const leader = ranked[0]

  return {
    points,
    totalMinutes,
    daysStudied,
    averagePerStudiedDay: daysStudied === 0 ? null : Math.round(totalMinutes / daysStudied),
    topSubject: leader ? { name: leader.name, minutes: leader.minutes } : null,
  }
}
