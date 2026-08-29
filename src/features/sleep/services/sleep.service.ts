import { toAppError } from '@/core/error'
import { type Baseline, baselineOf, toDateKey } from '@/shared/utils'

import { sleepRepository } from '../repositories/sleep.repository'
import type { SleepGoalValues } from '../schemas/sleep.schema'
import type {
  LogSleepInput,
  SleepGoal,
  SleepHistory,
  SleepLog,
  SleepPeriodSeries,
} from '../types/sleep.types'
import { totalMinutesByDate } from '../utils/daily-sleep'
import { buildSleepHistory } from '../utils/sleep-history'
import { buildSleepSeries } from '../utils/sleep-series'

/**
 * Días que se miran para saber cuánto sueles dormir.
 *
 * Treinta porque una costumbre necesita tiempo: con siete, una semana rara
 * —viajes, un examen, un bebé— se convertiría en «lo normal en ti».
 */
const TYPICAL_WINDOW_DAYS = 30

/**
 * Días con registro que hacen falta para hablar de costumbre.
 *
 * Menos de siete no es una costumbre, es una temporada. Y mientras no lleguen,
 * la aplicación calla y se queda con la referencia general: es mejor no decir
 * nada que decir «lo normal en ti» apoyándose en tres noches.
 */
const TYPICAL_MIN_DAYS = 7

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
      return await sleepRepository.findNightByDate(userId, toDateKey(today))
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
  /**
   * Cuánto suele dormir, para poder compararlo consigo mismo.
   *
   * **Suma la noche y las siestas de cada día** antes de sacar la mediana: lo
   * que se compara es lo dormido, no el registro que llegara de último.
   *
   * Devuelve `null` mientras no haya días suficientes, y entonces el motor se
   * queda con la referencia general. Preferimos callar a inventar una costumbre.
   */
  async getTypicalMinutes(userId: string, today: Date): Promise<Baseline | null> {
    try {
      const desde = new Date(today)
      desde.setDate(desde.getDate() - TYPICAL_WINDOW_DAYS)

      const logs = await sleepRepository.listLogsBetween(userId, toDateKey(desde), toDateKey(today))

      return baselineOf([...totalMinutesByDate(logs).values()], TYPICAL_MIN_DAYS)
    } catch (error) {
      throw toAppError(error)
    }
  },

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
   *
   * **La noche corrige; la siesta se suma.** Una noche sólo se duerme una vez,
   * así que volver a guardarla actualiza la que hubiera —volver a la pantalla
   * debe corregir, no duplicar—. Una siesta es otra cosa: se puede echar una
   * después de comer y otra a media tarde, y las dos cuentan. Por eso una
   * siesta siempre entra como registro nuevo.
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
      if (input.kind === 'night') {
        const existing = await sleepRepository.findNightByDate(input.userId, input.dateKey)
        if (existing) {
          await sleepRepository.updateLog(existing.id, row)
          return
        }
      }

      await sleepRepository.insertLog({
        id: input.id,
        user_id: input.userId,
        date: input.dateKey,
        // Sin esto la base pone su valor por defecto —noche— y una siesta se
        // guardaba como noche, pisando la de ese día. Pasó de verdad.
        kind: input.kind,
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
