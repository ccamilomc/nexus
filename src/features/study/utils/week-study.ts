import { calculateProgress } from '@/shared/utils'

import type { StudySessionWithSubject, Subject, SubjectWeek, WeekStudy } from '../types/study.types'

/**
 * Compone la semana: lo estudiado en cada materia frente a su objetivo.
 *
 * Aparecen **todas las materias con objetivo**, aunque no se hayan tocado en
 * toda la semana: una materia olvidada a cero es justo la que hay que ver. Las
 * que no tienen objetivo sólo se listan si tienen tiempo, porque sin cifra que
 * perseguir ni tiempo que mostrar no dicen nada.
 *
 * Orden: primero las que tienen objetivo —son las que se están persiguiendo— y
 * dentro de cada grupo, de más a menos estudiada.
 */
export function buildWeekStudy(
  subjects: readonly Subject[],
  sessions: readonly StudySessionWithSubject[],
): WeekStudy {
  const minutesBySubject = new Map<string, number>()
  let totalMinutes = 0

  for (const session of sessions) {
    totalMinutes += session.duration_minutes
    if (!session.subject_id) continue

    minutesBySubject.set(
      session.subject_id,
      (minutesBySubject.get(session.subject_id) ?? 0) + session.duration_minutes,
    )
  }

  const bySubject = subjects
    .map((subject): SubjectWeek => {
      const minutes = minutesBySubject.get(subject.id) ?? 0
      const targetMinutes = subject.weekly_target_minutes

      return {
        subject: { id: subject.id, name: subject.name, color: subject.color },
        minutes,
        targetMinutes,
        progress: targetMinutes === null ? null : calculateProgress(minutes, targetMinutes),
      }
    })
    .filter((entry) => entry.targetMinutes !== null || entry.minutes > 0)
    .sort(byTargetThenTime)

  const targetMinutes = sumTargets(subjects)

  return {
    totalMinutes,
    targetMinutes,
    progress: targetMinutes === null ? null : calculateProgress(totalMinutes, targetMinutes),
    bySubject,
  }
}

function byTargetThenTime(a: SubjectWeek, b: SubjectWeek): number {
  const aHasTarget = a.targetMinutes !== null
  const bHasTarget = b.targetMinutes !== null

  if (aHasTarget !== bHasTarget) return aHasTarget ? -1 : 1
  return b.minutes - a.minutes
}

/** Suma de objetivos; `null` si ninguna materia se fijó uno. */
function sumTargets(subjects: readonly Subject[]): number | null {
  const targets = subjects
    .map((subject) => subject.weekly_target_minutes)
    .filter((target): target is number => target !== null)

  return targets.length === 0 ? null : targets.reduce((total, target) => total + target, 0)
}
