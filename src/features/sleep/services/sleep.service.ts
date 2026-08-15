import { createAppError, toAppError } from '@/core/error'
import { parseDateKey, toDateKey } from '@/shared/utils'

import { sleepRepository } from '../repositories/sleep.repository'
import type { LogSleepValues, SleepGoalValues } from '../schemas/sleep.schema'
import type { SleepGoal, SleepHistory, SleepLog, SleepPeriodSeries } from '../types/sleep.types'
import { buildSleepHistory } from '../utils/sleep-history'
import { buildSleepSeries } from '../utils/sleep-series'
import { sleepInstants, sleepMinutes } from '../utils/sleep-time'

/** Noches que se traen para el historial y su media. */
const HISTORY_NIGHTS = 7

/** Reglas de negocio de sueño. Traduce errores técnicos a `AppError`. */
export const sleepService = {
  /**
   * Lo dormido anoche.
   *
   * Una noche se guarda con la fecha del día en que uno **se despierta**: al
   * abrir la aplicación por la mañana, «anoche» es el registro de hoy.
   */
  async getLastNight(userId: string, today: Date): Promise<SleepLog | null> {
    try {
      return await sleepRepository.findLogByDate(userId, toDateKey(today))
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** El objetivo vigente, o `null` si el usuario no ha fijado ninguno. */
  async getActiveGoal(userId: string): Promise<SleepGoal | null> {
    try {
      return await sleepRepository.findActiveGoal(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Guarda cuánto quieres dormir.
   *
   * **No se edita el vigente: se jubila y se crea otro**, igual que los
   * objetivos de nutrición. Así queda el historial de qué perseguías en cada
   * momento, que es para lo que el esquema previó `is_active`.
   *
   * El formulario habla en horas porque así se piensa el sueño; la base guarda
   * minutos, que es su unidad.
   */
  async saveGoal(userId: string, values: SleepGoalValues): Promise<SleepGoal> {
    try {
      await sleepRepository.deactivateGoals(userId)

      return await sleepRepository.insertGoal({
        user_id: userId,
        target_minutes: Math.round(values.targetHours * 60),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Las últimas noches, con sus medias. */
  async getHistory(userId: string): Promise<SleepHistory> {
    try {
      const logs = await sleepRepository.listRecentLogs(userId, HISTORY_NIGHTS)

      return buildSleepHistory(logs)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * El sueño de un periodo y el del tramo anterior, para Analytics.
   *
   * Los dos tramos son contiguos, así que se piden en **una sola consulta** que
   * los cubre enteros y se reparten después por fecha.
   */
  async getSeries(
    userId: string,
    days: readonly Date[],
    previousDays: readonly Date[],
  ): Promise<SleepPeriodSeries> {
    try {
      const first = previousDays[0] ?? days[0]
      const last = days[days.length - 1]
      if (!first || !last) return buildSleepSeries([], days, previousDays)

      const samples = await sleepRepository.listLogsBetween(
        userId,
        toDateKey(first),
        toDateKey(last),
      )

      return buildSleepSeries(samples, days, previousDays)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Registra (o corrige) una noche.
   *
   * La duración se **calcula** de las horas: nadie sabe cuántos minutos durmió,
   * pero todo el mundo recuerda cuándo se acostó y cuándo sonó el despertador.
   * Si ya había registro para esa fecha se actualiza, porque una noche sólo se
   * duerme una vez y volver a la pantalla debe corregir, no duplicar.
   *
   * **La noche llega en los valores y no como el día de hoy.** El sueño se
   * apunta al levantarse y olvidarse un par de días es lo normal; sin poder
   * elegirla, esas noches no había manera de recuperarlas.
   */
  async logSleep(userId: string, values: LogSleepValues): Promise<void> {
    try {
      const date = parseDateKey(values.date)
      if (Number.isNaN(date.getTime())) {
        throw createAppError('validation', 'Revisa el día: no se entiende.')
      }

      const minutes = sleepMinutes(values.bedtime, values.wakeTime)
      const instants = sleepInstants(date, values.bedtime, values.wakeTime)
      if (minutes === null || instants === null) {
        throw createAppError('validation', 'Revisa las horas: no son válidas.')
      }

      const dateKey = values.date
      const row = {
        bedtime: instants.bedtimeIso,
        wake_time: instants.wakeTimeIso,
        duration_minutes: minutes,
        quality_rating: values.qualityRating ?? null,
      }

      const existing = await sleepRepository.findLogByDate(userId, dateKey)
      if (existing) {
        await sleepRepository.updateLog(existing.id, row)
        return
      }

      await sleepRepository.insertLog({ user_id: userId, date: dateKey, ...row })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Quita el registro de una noche apuntada por error. */
  async removeLog(logId: string): Promise<void> {
    try {
      await sleepRepository.softDeleteLog(logId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },
}
