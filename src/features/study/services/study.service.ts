import { createAppError, toAppError } from '@/core/error'
import { type DayRange, dayRange, parseDateKey, toLoggedAt, weekRange } from '@/shared/utils'

import { nextSubjectColor } from '../constants/study.constants'
import { studyRepository } from '../repositories/study.repository'
import type { CreateSubjectValues, LogStudyValues } from '../schemas/study.schema'
import type {
  DayStudy,
  StudyPeriodSeries,
  StudySessionWithSubject,
  Subject,
  WeekStudy,
} from '../types/study.types'
import { buildDayStudy } from '../utils/day-study'
import { elapsedMinutes } from '../utils/elapsed-minutes'
import { buildStudySeries } from '../utils/study-series'
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

  /**
   * Crea una materia y **le pone un color que no esté cogido**.
   *
   * Cuesta una consulta más, y sale a cuenta: crear una materia se hace muy de
   * vez en cuando, y sin esto todas salían del color por defecto de la columna,
   * con lo que el punto que las distingue en cuatro pantallas no distinguía nada.
   */
  async createSubject(userId: string, values: CreateSubjectValues): Promise<Subject> {
    try {
      const existing = await studyRepository.listSubjects(userId)

      return await studyRepository.insertSubject({
        user_id: userId,
        name: values.name,
        weekly_target_minutes: toWeeklyTargetMinutes(values),
        color: nextSubjectColor(existing.map(({ color }) => color)),
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
   * Las materias retiradas, para poder consultarlas y recuperarlas.
   *
   * Retirar una era irreversible desde la pantalla: desaparecía de la lista y no
   * había dónde volver a encontrarla, aunque sus horas siguieran contando. El
   * botón dice «Retirar», que suena a que se puede deshacer, y ahora se puede.
   */
  async getRetiredSubjects(userId: string): Promise<readonly Subject[]> {
    try {
      return await studyRepository.listRetiredSubjects(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Devuelve una materia retirada a la lista, con su historial intacto. */
  async restoreSubject(subjectId: string): Promise<void> {
    try {
      await studyRepository.updateSubject(subjectId, { deleted_at: null })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Borra del todo una materia que nunca se llegó a usar.
   *
   * Para la que se creó por error: se escribe mal, se retira, y hasta ahora se
   * quedaba ahí sin manera de quitarla.
   *
   * **Sólo si no tiene ninguna sesión.** Con horas estudiadas la salida es
   * retirarla: ese tiempo se estudió de verdad y sigue contando en los totales.
   * La comprobación va aquí porque la base no la hace: su clave ajena es
   * `on delete set null`, así que dejaría las sesiones sin materia en lugar de
   * negarse, y la pantalla espera que la tengan.
   */
  async deleteSubjectForever(subjectId: string): Promise<void> {
    try {
      const sessions = await studyRepository.countSessions(subjectId)
      if (sessions > 0) {
        throw createAppError(
          'conflict',
          'Esta materia tiene horas estudiadas, así que no se borra: retírala y seguirán contando.',
        )
      }

      await studyRepository.deleteSubjectForever(subjectId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * El estudio de un periodo y el del tramo anterior, para Analytics.
   *
   * Una sola consulta: los dos tramos son contiguos, así que se piden juntos y
   * se reparten después por fecha.
   */
  async getSeries(
    userId: string,
    range: DayRange,
    previousRange: DayRange,
    days: readonly Date[],
    previousDays: readonly Date[],
  ): Promise<StudyPeriodSeries> {
    try {
      const sessions = await studyRepository.listSessionsBetween(
        userId,
        previousRange.fromIso,
        range.toIso,
      )

      return buildStudySeries(sessions, days, previousDays)
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
   * Registra una sesión ya terminada, en el día que se indique.
   *
   * Se pide la duración, no las horas: quien registra después de estudiar
   * recuerda «hora y media», no el minuto exacto en que empezó. La sesión se
   * coloca **hacia atrás desde el final del día elegido**: si es hoy, desde
   * ahora; si ya pasó, desde su mediodía, la misma regla que usan salud,
   * nutrición y sueño para lo que se apunta tarde.
   *
   * **Antes se colgaba siempre de `new Date()`**, así que una tarde de estudio
   * sin registrar no había forma de recuperarla: al apuntarla al día siguiente
   * se sumaba al día equivocado.
   */
  async logStudy(userId: string, values: LogStudyValues, now: Date): Promise<void> {
    try {
      const day = parseDateKey(values.date)
      if (Number.isNaN(day.getTime())) {
        throw createAppError('validation', 'Revisa el día: no se entiende.')
      }

      const endedAt = new Date(toLoggedAt(day, now))
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
   *
   * `targetMinutes` es la duración que el usuario se propuso, y **se guarda con
   * la sesión** por el mismo motivo que `started_at`: si viviera en la pantalla,
   * recargar convertiría un bloque de 25 minutos en uno sin límite. `null` es un
   * bloque abierto, que sigue siendo una opción legítima.
   */
  async startSession(
    userId: string,
    subjectId: string,
    targetMinutes: number | null,
  ): Promise<StudySessionWithSubject> {
    try {
      const active = await studyRepository.findActiveSession(userId)
      if (active) return active

      await studyRepository.insertSession({
        user_id: userId,
        subject_id: subjectId,
        started_at: new Date().toISOString(),
        target_minutes: targetMinutes,
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
