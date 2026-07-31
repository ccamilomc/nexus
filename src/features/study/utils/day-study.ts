import type { DayStudy, StudySessionWithSubject, SubjectTime } from '../types/study.types'

/**
 * Compone lo estudiado en un periodo: el total y el reparto por materia.
 *
 * Las materias se ordenan de más a menos tiempo, que es como se lee («¿a qué
 * le he dedicado el día?»). Una sesión sin materia suma al total pero no
 * aparece en el reparto: el esquema permite `subject_id` nulo aunque la
 * aplicación siempre pida materia.
 */
export function buildDayStudy(sessions: readonly StudySessionWithSubject[]): DayStudy {
  const minutesBySubject = new Map<string, SubjectTime>()
  let totalMinutes = 0

  for (const session of sessions) {
    totalMinutes += session.duration_minutes

    const { subject } = session
    if (!subject) continue

    const current = minutesBySubject.get(subject.id)
    if (current) {
      minutesBySubject.set(subject.id, {
        subject,
        minutes: current.minutes + session.duration_minutes,
      })
    } else {
      minutesBySubject.set(subject.id, { subject, minutes: session.duration_minutes })
    }
  }

  const bySubject = [...minutesBySubject.values()].sort((a, b) => b.minutes - a.minutes)

  return { sessions, totalMinutes, bySubject }
}
