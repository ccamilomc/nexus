import { toAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import { sleepRepository } from '../repositories/sleep.repository'
import type { SleepGoalValues } from '../schemas/sleep.schema'
import type {
  LogSleepInput,
  SleepGoal,
  SleepHistory,
  SleepLog,
  SleepPeriodSeries,
} from '../types/sleep.types'
import { buildSleepHistory } from '../utils/sleep-history'
import { buildSleepSeries } from '../utils/sleep-series'

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
      if (!first || !last) return buildSleepSeries([], days, previousDays, null)

      // El objetivo va con la serie porque es **contra lo que se lee**: sin él,
      // la gráfica sólo dice que unas noches se durmió más que otras. Se piden
      // a la vez para no encadenar dos esperas.
      const [samples, goal] = await Promise.all([
        sleepRepository.listLogsBetween(userId, toDateKey(first), toDateKey(last)),
        sleepRepository.findActiveGoal(userId),
      ])

      return buildSleepSeries(samples, days, previousDays, goal?.target_minutes ?? null)
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
   *
   * Las horas llegan ya convertidas a instantes y minutos (`utils/sleep-input`)
   * porque esto puede quedarse esperando red y salir después (ADR-0011).
   */
  async logSleep(input: LogSleepInput): Promise<void> {
    try {
      const row = {
        bedtime: input.bedtimeIso,
        wake_time: input.wakeTimeIso,
        duration_minutes: input.minutes,
        quality_rating: input.qualityRating,
      }

      // La consulta se queda aquí: una mutación en cola no llega a ejecutarse
      // hasta que vuelve la red, así que cuando esto corre siempre hay conexión.
      const existing = await sleepRepository.findLogByDate(input.userId, input.dateKey)
      if (existing) {
        await sleepRepository.updateLog(existing.id, row)
        return
      }

      await sleepRepository.insertLog({
        id: input.id,
        user_id: input.userId,
        date: input.dateKey,
        ...row,
      })
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
