import { toAppError } from '@/core/error'
import { dayRange } from '@/shared/utils'

import { studyRepository } from '../repositories/study.repository'
import type { CreateSubjectValues, LogStudyValues } from '../schemas/study.schema'
import type { DayStudy, Subject } from '../types/study.types'
import { buildDayStudy } from '../utils/day-study'

const MS_PER_MINUTE = 60_000

/** El formulario habla en horas; la base guarda minutos, que es su unidad. */
function toWeeklyTargetMinutes(values: CreateSubjectValues): number | null {
  return values.weeklyTargetHours === undefined ? null : Math.round(values.weeklyTargetHours * 60)
}

/** Reglas de negocio de estudio. Traduce errores técnicos a `AppError`. */
export const studyService = {
  async getSubjects(userId: string): Promise<Subject[]> {
    try {
      return await studyRepository.listSubjects(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createSubject(userId: string, values: CreateSubjectValues): Promise<Subject> {
    try {
      return await studyRepository.insertSubject({
        user_id: userId,
        name: values.name,
        weekly_target_minutes: toWeeklyTargetMinutes(values),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  async updateSubject(subjectId: string, values: CreateSubjectValues): Promise<Subject> {
    try {
      return await studyRepository.updateSubject(subjectId, {
        name: values.name,
        weekly_target_minutes: toWeeklyTargetMinutes(values),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Retira una materia sin tocar lo ya estudiado.
   *
   * Borrado lógico: sus sesiones siguen contando en el historial y en los
   * totales, porque ese tiempo se estudió de verdad.
   */
  async deleteSubject(subjectId: string): Promise<void> {
    try {
      await studyRepository.updateSubject(subjectId, { deleted_at: new Date().toISOString() })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Lo estudiado en un día, con el reparto por materia. */
  async getDayStudy(userId: string, date: Date): Promise<DayStudy> {
    try {
      const { fromIso, toIso } = dayRange(date)
      const sessions = await studyRepository.listSessionsBetween(userId, fromIso, toIso)

      return buildDayStudy(sessions)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Registra una sesión ya terminada.
   *
   * Se pide la duración, no las horas: quien registra después de estudiar
   * recuerda «hora y media», no el minuto exacto en que empezó. La sesión se
   * coloca hacia atrás desde ahora, así queda a una hora verosímil y el día la
   * recoge donde toca.
   */
  async logStudy(userId: string, values: LogStudyValues): Promise<void> {
    try {
      const endedAt = new Date()
      const startedAt = new Date(endedAt.getTime() - values.minutes * MS_PER_MINUTE)

      await studyRepository.insertSession({
        user_id: userId,
        subject_id: values.subjectId,
        duration_minutes: values.minutes,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        ...(values.focusRating === undefined ? {} : { focus_rating: values.focusRating }),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Quita una sesión registrada por error. */
  async removeSession(sessionId: string): Promise<void> {
    try {
      await studyRepository.softDeleteSession(sessionId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },
}
