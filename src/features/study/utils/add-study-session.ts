import { calculateProgress } from '@/shared/utils'

import type {
  DayStudy,
  LogStudyInput,
  StudySessionWithSubject,
  SubjectRef,
  WeekStudy,
} from '../types/study.types'

/**
 * El día con la sesión recién apuntada, para verla antes de que salga.
 *
 * Las sesiones van de la más reciente a la más antigua, como llegan del
 * servidor, y el reparto por materia de más a menos estudiada.
 */
export function addSessionToDay(
  day: DayStudy | null,
  input: LogStudyInput,
  subject: SubjectRef,
): DayStudy {
  const session: StudySessionWithSubject = {
    id: input.id,
    user_id: input.userId,
    subject_id: input.subjectId,
    duration_minutes: input.minutes,
    started_at: input.startedAt,
    ended_at: input.endedAt,
    target_minutes: null,
    technique: null,
    focus_rating: input.focusRating ?? null,
    notes: null,
    deleted_at: null,
    created_at: input.endedAt,
    updated_at: input.endedAt,
    subject,
  }

  return {
    sessions: [session, ...(day?.sessions ?? [])],
    totalMinutes: (day?.totalMinutes ?? 0) + input.minutes,
    bySubject: addMinutes(day?.bySubject ?? [], subject, input.minutes),
  }
}

/**
 * La semana con los minutos sumados, incluido el avance hacia los objetivos.
 *
 * Se suma a lo que había en vez de recalcularse: la semana no guarda las
 * sesiones, sólo los totales. El progreso sí se rehace, porque la cifra
 * cambió y una barra que no se mueve al apuntar parece que no registró.
 *
 * Devuelve `null` si aún no hay semana cargada: sin ella no hay objetivos que
 * medir, y montar una a medias enseñaría un total sin el contexto que le da
 * sentido.
 */
export function addMinutesToWeek(
  week: WeekStudy | null,
  subjectId: string,
  minutes: number,
): WeekStudy | null {
  if (!week) return null

  const totalMinutes = week.totalMinutes + minutes

  return {
    totalMinutes,
    targetMinutes: week.targetMinutes,
    progress:
      week.targetMinutes === null ? null : calculateProgress(totalMinutes, week.targetMinutes),
    bySubject: week.bySubject.map((entry) => {
      if (entry.subject.id !== subjectId) return entry

      const subjectMinutes = entry.minutes + minutes

      return {
        ...entry,
        minutes: subjectMinutes,
        progress:
          entry.targetMinutes === null
            ? null
            : calculateProgress(subjectMinutes, entry.targetMinutes),
      }
    }),
  }
}

/** Suma los minutos a su materia, o la abre si es la primera vez del día. */
function addMinutes(
  bySubject: readonly { readonly subject: SubjectRef; readonly minutes: number }[],
  subject: SubjectRef,
  minutes: number,
): readonly { readonly subject: SubjectRef; readonly minutes: number }[] {
  const isKnown = bySubject.some((entry) => entry.subject.id === subject.id)

  const updated = isKnown
    ? bySubject.map((entry) =>
        entry.subject.id === subject.id ? { ...entry, minutes: entry.minutes + minutes } : entry,
      )
    : [...bySubject, { subject, minutes }]

  return [...updated].sort((a, b) => b.minutes - a.minutes)
}
