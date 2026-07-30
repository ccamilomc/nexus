import { toAppError } from '@/core/error'

import { habitsRepository } from '../repositories/habits.repository'
import type { CreateHabitValues } from '../schemas/habits.schema'
import type { Habit, HabitToday } from '../types/habits.types'
import { lastDays, toDateKey } from '../utils/date-key'
import { buildHabitsToday } from '../utils/habits-today'

/**
 * Días que se traen para pintar el mini-calendario y calcular la racha.
 *
 * 60 días cubren de sobra cualquier racha razonable sin traerse el historial
 * entero. Si alguien supera los 60 días seguidos, la racha se verá recortada;
 * es un límite conocido y se ampliará cuando haga falta.
 */
const HISTORY_DAYS = 60

/** Días que se muestran en el mini-calendario de cada hábito. */
export const RECENT_DAYS = 7

/**
 * Ventana de la constancia.
 *
 * 30 días son el mes «rodante» con el que la gente juzga si mantiene un hábito,
 * y salen de los registros que ya se traen: no cuesta ninguna consulta extra.
 */
export const CONSISTENCY_DAYS = 30

/** Reglas de negocio de hábitos. Traduce errores técnicos a `AppError`. */
export const habitsService = {
  /** Los hábitos activos con su estado de hoy, su racha y sus últimos días. */
  async getHabitsToday(userId: string, today: Date): Promise<readonly HabitToday[]> {
    try {
      const habits = await habitsRepository.listHabits(userId)
      if (habits.length === 0) return []

      const window = lastDays(today, HISTORY_DAYS)
      const fromKey = toDateKey(window[0] ?? today)
      const logs = await habitsRepository.listLogsBetween(userId, fromKey, toDateKey(today))

      return buildHabitsToday(habits, logs, today, RECENT_DAYS, CONSISTENCY_DAYS)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createHabit(userId: string, values: CreateHabitValues): Promise<Habit> {
    try {
      return await habitsRepository.insertHabit({
        user_id: userId,
        name: values.name,
        description: values.description ?? null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Marca o desmarca un hábito en una fecha.
   *
   * Desmarcar **borra** el registro en lugar de dejarlo en `completed: false`:
   * «no lo hice» y «no lo registré» son lo mismo para una racha, y así el
   * índice único por (hábito, fecha) permite volver a marcarlo.
   */
  async toggleHabit(userId: string, habitId: string, date: Date, isDone: boolean): Promise<void> {
    try {
      const dateKey = toDateKey(date)

      if (isDone) {
        await habitsRepository.deleteLog(habitId, dateKey)
        return
      }

      await habitsRepository.insertLog({ user_id: userId, habit_id: habitId, date: dateKey })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Archiva un hábito: desaparece de la lista sin perder su historial. */
  async archiveHabit(habitId: string): Promise<void> {
    try {
      await habitsRepository.updateHabit(habitId, { archived_at: new Date().toISOString() })
    } catch (error) {
      throw toAppError(error)
    }
  },
}
