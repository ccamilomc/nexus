import { toAppError } from '@/core/error'
import { minusDays, previousDay, toDateKey } from '@/shared/utils'

import { habitsRepository } from '../repositories/habits.repository'
import type { CreateHabitValues } from '../schemas/habits.schema'
import type { Habit, HabitLog, HabitToday } from '../types/habits.types'
import { buildHabitsToday } from '../utils/habits-today'
import { hasCompletedOn } from '../utils/streak'

/**
 * Ventana inicial del historial.
 *
 * Cubre el mini-calendario, la constancia y casi cualquier racha con una sola
 * consulta.
 */
const HISTORY_DAYS = 60

/**
 * Tramo que se pide cuando una racha sigue viva en el día más antiguo traído.
 *
 * Un año por viaje: quien lleve años sin fallar paga una consulta por año, y
 * quien no —la inmensa mayoría de las cargas— no paga ninguna.
 */
const HISTORY_CHUNK_DAYS = 365

/**
 * Tope de tramos (~10 años). No es un límite del producto: es una red de
 * seguridad para que un dato imposible no encadene consultas sin fin.
 */
const MAX_HISTORY_CHUNKS = 10

/** Días que se muestran en el mini-calendario de cada hábito. */
export const RECENT_DAYS = 7

/**
 * Ventana de la constancia.
 *
 * 30 días son el mes «rodante» con el que la gente juzga si mantiene un hábito,
 * y salen de los registros que ya se traen: no cuesta ninguna consulta extra.
 */
export const CONSISTENCY_DAYS = 30

/**
 * Registros necesarios para pintar la pantalla y calcular las rachas.
 *
 * Se trae una ventana reciente y, **sólo si alguna racha sigue viva en su día
 * más antiguo**, se piden tramos anteriores. Así una racha larga no se recorta
 * al borde de la ventana —lo que castigaría justo a quien mejor lo hace— y el
 * caso normal se sigue resolviendo con una única consulta.
 */
async function loadHistory(userId: string, today: Date): Promise<readonly HabitLog[]> {
  const logs: HabitLog[] = []
  let toDate = today
  let days = HISTORY_DAYS

  for (let chunk = 0; chunk < MAX_HISTORY_CHUNKS; chunk += 1) {
    const fromDate = minusDays(toDate, days - 1)
    const fromKey = toDateKey(fromDate)

    logs.push(...(await habitsRepository.listLogsBetween(userId, fromKey, toDateKey(toDate))))

    // Ninguna racha llega al día más antiguo traído: no hay nada más que buscar.
    if (!hasCompletedOn(logs, fromKey)) break

    toDate = previousDay(fromDate)
    days = HISTORY_CHUNK_DAYS
  }

  return logs
}

/** Reglas de negocio de hábitos. Traduce errores técnicos a `AppError`. */
export const habitsService = {
  /** Los hábitos activos con su estado de hoy, su racha y sus últimos días. */
  async getHabitsToday(userId: string, today: Date): Promise<readonly HabitToday[]> {
    try {
      const habits = await habitsRepository.listHabits(userId)
      if (habits.length === 0) return []

      const logs = await loadHistory(userId, today)

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
   * Marca o desmarca un hábito en un día.
   *
   * El día llega ya como clave `YYYY-MM-DD` —lo que guarda la columna `date`—
   * porque un hábito se cumple «el martes», no en un instante: así se puede
   * corregir un día pasado sin convertir fechas de ida y vuelta.
   *
   * Desmarcar **borra** el registro en lugar de dejarlo en `completed: false`:
   * «no lo hice» y «no lo registré» son lo mismo para una racha, y así el
   * índice único por (hábito, fecha) permite volver a marcarlo.
   */
  async toggleHabit(
    userId: string,
    habitId: string,
    dateKey: string,
    isDone: boolean,
  ): Promise<void> {
    try {
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

  /** Los hábitos archivados, para poder consultarlos y recuperarlos. */
  async getArchivedHabits(userId: string): Promise<readonly Habit[]> {
    try {
      return await habitsRepository.listArchivedHabits(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Devuelve un hábito archivado a la lista.
   *
   * Su historial nunca se tocó, así que la racha y la constancia vuelven tal y
   * como estaban: archivar es guardar, no borrar.
   */
  async restoreHabit(habitId: string): Promise<void> {
    try {
      await habitsRepository.updateHabit(habitId, { archived_at: null })
    } catch (error) {
      throw toAppError(error)
    }
  },
}
