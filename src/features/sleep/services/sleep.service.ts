import { createAppError, toAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import { sleepRepository } from '../repositories/sleep.repository'
import type { LogSleepValues } from '../schemas/sleep.schema'
import type { SleepHistory, SleepLog } from '../types/sleep.types'
import { buildSleepHistory } from '../utils/sleep-history'
import { sleepInstants, sleepMinutes } from '../utils/sleep-time'

/** Noches que se traen para el historial y su media. */
export const HISTORY_NIGHTS = 7

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
   * Registra (o corrige) la noche.
   *
   * La duración se **calcula** de las horas: nadie sabe cuántos minutos durmió,
   * pero todo el mundo recuerda cuándo se acostó y cuándo sonó el despertador.
   * Si ya había registro para esa fecha se actualiza, porque una noche sólo se
   * duerme una vez y volver a la pantalla debe corregir, no duplicar.
   */
  async logSleep(userId: string, today: Date, values: LogSleepValues): Promise<void> {
    try {
      const minutes = sleepMinutes(values.bedtime, values.wakeTime)
      const instants = sleepInstants(today, values.bedtime, values.wakeTime)
      if (minutes === null || instants === null) {
        throw createAppError('validation', 'Revisa las horas: no son válidas.')
      }

      const dateKey = toDateKey(today)
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
