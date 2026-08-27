import { createAppError, toAppError } from '@/core/error'
import { minusDays, previousDay, toDateKey } from '@/shared/utils'

import { habitsRepository } from '../repositories/habits.repository'
import type { CreateHabitValues } from '../schemas/habits.schema'
import type { Habit, HabitLog, HabitsPeriodSeries, HabitToday } from '../types/habits.types'
import { buildHabitsSeries } from '../utils/habits-series'
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
const RECENT_DAYS = 7

/**
 * Ventana de la constancia.
 *
 * 30 días son el mes «rodante» con el que la gente juzga si mantiene un hábito,
 * y salen de los registros que ya se traen: no cuesta ninguna consulta extra.
 */
const CONSISTENCY_DAYS = 30

/**
 * Marcar (o desmarcar) un día, **ya resuelto y serializable**.
 *
 * Sin nada del closure: esto puede quedarse esperando red y salir mucho después
 * (ADR-0011).
 */
export interface ToggleHabitInput {
  /** Generado en el cliente; sólo se usa al marcar. */
  readonly id: string
  readonly userId: string
  readonly habitId: string
  /** Día en `YYYY-MM-DD`: puede ser hoy o uno ya pasado. */
  readonly dateKey: string
  /** Estado **actual**: el servicio lo invierte. */
  readonly isDone: boolean
}

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

  /**
   * Los hábitos de un periodo y los del tramo anterior, para Analytics.
   *
   * Hacen falta los hábitos además de los registros: uno creado hace meses y
   * nunca cumplido no aparece en ningún log, y aun así cuenta como incumplido
   * (ver `buildHabitsSeries`).
   */
  async getSeries(
    userId: string,
    days: readonly Date[],
    previousDays: readonly Date[],
  ): Promise<HabitsPeriodSeries> {
    try {
      const first = previousDays[0] ?? days[0]
      const last = days[days.length - 1]
      if (!first || !last) return buildHabitsSeries([], [], days, previousDays)

      const [habits, logs] = await Promise.all([
        habitsRepository.listHabits(userId),
        habitsRepository.listLogsBetween(userId, toDateKey(first), toDateKey(last)),
      ])

      return buildHabitsSeries(habits, logs, days, previousDays)
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
        // Sin días marcados se guarda `null` y no una lista vacía: en la base,
        // «todos los días» es la ausencia de lista, y dos formas de decir lo
        // mismo acaban en dos ramas distintas al leerlo.
        target_weekdays: values.weekdays.length > 0 ? [...values.weekdays].sort() : null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Cambia el nombre o la nota de un hábito.
   *
   * Cambia el nombre, la nota o los días. **Sin tocar sus registros ni su fecha
   * de creación**, que es todo lo que sostiene la racha y la constancia:
   * corregir una errata en el nombre no puede costar el historial.
   *
   * Cambiar los días **recalcula el pasado**: quien pase un hábito diario a
   * lunes-miércoles-viernes verá subir su constancia, porque los martes dejan de
   * contar como fallados. Es lo correcto —el hábito es el que es hoy— y conviene
   * saberlo antes de extrañarse.
   */
  async updateHabit(habitId: string, values: CreateHabitValues): Promise<Habit> {
    try {
      return await habitsRepository.updateHabit(habitId, {
        name: values.name,
        description: values.description ?? null,
        // Sin días marcados se guarda `null` y no una lista vacía: en la base,
        // «todos los días» es la ausencia de lista, y dos formas de decir lo
        // mismo acaban en dos ramas distintas al leerlo.
        target_weekdays: values.weekdays.length > 0 ? [...values.weekdays].sort() : null,
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
   *
   * Se encola si no hay red (ADR-0011), y las dos mitades aguantan repetirse:
   * borrar dos veces no hace nada, e insertar dos veces choca con ese mismo
   * índice único en vez de duplicar el día.
   */
  async toggleHabit(input: ToggleHabitInput): Promise<void> {
    try {
      if (input.isDone) {
        await habitsRepository.deleteLog(input.habitId, input.dateKey)
        return
      }

      await habitsRepository.insertLog({
        id: input.id,
        user_id: input.userId,
        habit_id: input.habitId,
        date: input.dateKey,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Borra del todo un hábito que nunca se llegó a usar.
   *
   * Existe para el error de tecleo: se crea «adasd», se archiva, y hasta ahora
   * se quedaba ahí para siempre porque lo único que se ofrecía era recuperarlo.
   *
   * **Sólo si no tiene ningún día marcado.** Con historial, la salida es
   * archivar: archivar guarda y borrar destruye, y una racha de meses no se tira
   * por un botón. La comprobación va aquí y no en la base a propósito: la clave
   * ajena es `on delete cascade`, así que Postgres borraría los registros en
   * silencio en lugar de negarse.
   */
  async deleteHabit(habitId: string): Promise<void> {
    try {
      const logs = await habitsRepository.countLogs(habitId)
      if (logs > 0) {
        throw createAppError(
          'conflict',
          'Este hábito tiene días marcados, así que no se borra: archívalo y su historial se queda.',
        )
      }

      await habitsRepository.deleteHabit(habitId)
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
