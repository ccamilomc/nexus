import { createAppError, toAppError } from '@/core/error'
import { dayRange, weekRange } from '@/shared/utils'

import { studyRepository } from '../repositories/study.repository'
import type { CreateSubjectValues, LogStudyValues } from '../schemas/study.schema'
import type { DayStudy, StudySessionWithSubject, Subject, WeekStudy } from '../types/study.types'
import { buildDayStudy } from '../utils/day-study'
import { elapsedMinutes } from '../utils/elapsed-minutes'
import { buildWeekStudy } from '../utils/week-study'

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

  /**
   * La semana de estudio (de lunes a domingo), con el avance por materia.
   *
   * Necesita las materias además de las sesiones: una materia con objetivo que
   * no se ha tocado en toda la semana tiene que salir a cero, y en las sesiones
   * no aparece.
   */
  async getWeekStudy(userId: string, date: Date): Promise<WeekStudy> {
    try {
      const { fromIso, toIso } = weekRange(date)
      const [subjects, sessions] = await Promise.all([
        studyRepository.listSubjects(userId),
        studyRepository.listSessionsBetween(userId, fromIso, toIso),
      ])

      return buildWeekStudy(subjects, sessions)
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

  /** La sesión que sigue corriendo, si la hay. */
  async getActiveSession(userId: string): Promise<StudySessionWithSubject | null> {
    try {
      return await studyRepository.findActiveSession(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Pone el cronómetro en marcha.
   *
   * Sólo puede haber una sesión corriendo: si ya hay una, se devuelve esa misma
   * en lugar de abrir otra. Así una doble pulsación —o el móvil y el portátil a
   * la vez— nunca parten el rato de estudio en dos registros.
   */
  async startSession(userId: string, subjectId: string): Promise<StudySessionWithSubject> {
    try {
      const active = await studyRepository.findActiveSession(userId)
      if (active) return active

      await studyRepository.insertSession({
        user_id: userId,
        subject_id: subjectId,
        started_at: new Date().toISOString(),
      })

      // Se relee para recuperar la materia enlazada, que la inserción no trae.
      const started = await studyRepository.findActiveSession(userId)
      if (!started) throw createAppError('unknown')

      return started
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Para el cronómetro y guarda lo estudiado.
   *
   * La duración se calcula desde la hora de inicio del servidor, no desde lo que
   * marcaba la pantalla: así el registro es el mismo aunque la pestaña estuviera
   * suspendida o el reloj del dispositivo vaya desviado.
   */
  async finishSession(sessionId: string, startedAtIso: string): Promise<void> {
    try {
      const endedAt = new Date()

      await studyRepository.updateSession(sessionId, {
        ended_at: endedAt.toISOString(),
        duration_minutes: elapsedMinutes(startedAtIso, endedAt),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Descarta la sesión en curso: no llegó a ser tiempo de estudio. */
  async discardSession(sessionId: string): Promise<void> {
    try {
      await studyRepository.softDeleteSession(sessionId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },
}
