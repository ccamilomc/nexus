import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAppError } from '@/core/error'
import { minusDays, toDateKey } from '@/shared/utils'

import { habitsRepository } from '../repositories/habits.repository'
import type { Habit, HabitLog } from '../types/habits.types'
import { habitsService } from './habits.service'

/**
 * El repositorio se sustituye por completo: estos tests comprueban **reglas de
 * negocio**, no consultas. Con la factoría, el módulo real ni siquiera se carga,
 * así que no arrastra el cliente de Supabase (ni sus variables de entorno).
 */
vi.mock('../repositories/habits.repository', () => ({
  habitsRepository: {
    listHabits: vi.fn(),
    listArchivedHabits: vi.fn(),
    listLogsBetween: vi.fn(),
    insertHabit: vi.fn(),
    updateHabit: vi.fn(),
    insertLog: vi.fn(),
    deleteLog: vi.fn(),
    countLogs: vi.fn(),
    deleteHabit: vi.fn(),
  },
}))

const listHabits = vi.mocked(habitsRepository.listHabits)
const listArchivedHabits = vi.mocked(habitsRepository.listArchivedHabits)
const listLogsBetween = vi.mocked(habitsRepository.listLogsBetween)
const insertHabit = vi.mocked(habitsRepository.insertHabit)
const updateHabit = vi.mocked(habitsRepository.updateHabit)
const insertLog = vi.mocked(habitsRepository.insertLog)
const deleteLog = vi.mocked(habitsRepository.deleteLog)
const countLogs = vi.mocked(habitsRepository.countLogs)
const deleteHabit = vi.mocked(habitsRepository.deleteHabit)

const USER_ID = 'user-1'
const TODAY = new Date(2026, 6, 29)

function habit(id: string, createdAt = '2020-01-01T10:00:00.000Z'): Habit {
  return {
    id,
    user_id: USER_ID,
    name: 'Leer',
    description: null,
    icon: 'circle-check',
    color: '#3b82f6',
    frequency: 'daily',
    target_count: 1,
    target_weekdays: null,
    is_active: true,
    archived_at: null,
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
  }
}

function log(habitId: string, offset: number): HabitLog {
  const dateKey = toDateKey(minusDays(TODAY, offset))

  return {
    id: `log-${habitId}-${offset}`,
    user_id: USER_ID,
    habit_id: habitId,
    date: dateKey,
    count: 1,
    completed: true,
    notes: null,
    created_at: `${dateKey}T10:00:00.000Z`,
    updated_at: `${dateKey}T10:00:00.000Z`,
    deleted_at: null,
  }
}

/** Registros consecutivos desde hoy hacia atrás: una racha de `days` días. */
function streakLogs(habitId: string, days: number): HabitLog[] {
  return Array.from({ length: days }, (_, offset) => log(habitId, offset))
}

/** Los registros que caen dentro de un rango, como haría la consulta real. */
function logsBetween(logs: readonly HabitLog[], fromKey: string, toKey: string): HabitLog[] {
  return logs.filter((entry) => entry.date >= fromKey && entry.date <= toKey)
}

beforeEach(() => {
  vi.clearAllMocks()
  listHabits.mockResolvedValue([])
  listLogsBetween.mockResolvedValue([])
})

describe('habitsService.getHabitsToday', () => {
  it('sin hábitos no consulta el historial', async () => {
    listHabits.mockResolvedValue([])

    await expect(habitsService.getHabitsToday(USER_ID, TODAY)).resolves.toEqual([])
    expect(listLogsBetween).not.toHaveBeenCalled()
  })

  it('pide los últimos 60 días y compone cada hábito con su racha', async () => {
    listHabits.mockResolvedValue([habit('h1')])
    listLogsBetween.mockResolvedValue(streakLogs('h1', 3))

    const [entry] = await habitsService.getHabitsToday(USER_ID, TODAY)

    expect(listLogsBetween).toHaveBeenCalledExactlyOnceWith(
      USER_ID,
      toDateKey(minusDays(TODAY, 59)),
      toDateKey(TODAY),
    )
    expect(entry?.isDoneToday).toBe(true)
    expect(entry?.streak).toBe(3)
    expect(entry?.recentDays).toHaveLength(7)
  })

  it('no mira más atrás si la racha se corta dentro de la ventana', async () => {
    listHabits.mockResolvedValue([habit('h1')])
    listLogsBetween.mockResolvedValue(streakLogs('h1', 59))

    const [entry] = await habitsService.getHabitsToday(USER_ID, TODAY)

    // El día 60 (el más antiguo traído) está sin cumplir: la racha acaba ahí.
    expect(listLogsBetween).toHaveBeenCalledTimes(1)
    expect(entry?.streak).toBe(59)
  })

  it('no recorta una racha que sobrepasa la ventana inicial', async () => {
    const logs = streakLogs('h1', 80)
    listHabits.mockResolvedValue([habit('h1')])
    listLogsBetween.mockImplementation(async (_userId, fromKey, toKey) =>
      logsBetween(logs, fromKey, toKey),
    )

    const [entry] = await habitsService.getHabitsToday(USER_ID, TODAY)

    // Antes se veía «60»: la racha se cortaba en el borde de lo consultado.
    expect(entry?.streak).toBe(80)
    expect(listLogsBetween).toHaveBeenCalledTimes(2)
  })

  it('encadena tramos hasta encontrar el día que rompió la racha', async () => {
    // Más de un año seguido: hace falta el tramo de 60 días y dos de 365.
    const logs = streakLogs('h1', 500)
    listHabits.mockResolvedValue([habit('h1')])
    listLogsBetween.mockImplementation(async (_userId, fromKey, toKey) =>
      logsBetween(logs, fromKey, toKey),
    )

    const [entry] = await habitsService.getHabitsToday(USER_ID, TODAY)

    expect(entry?.streak).toBe(500)
    expect(listLogsBetween).toHaveBeenCalledTimes(3)
  })

  it('basta con que un hábito siga vivo en el borde para mirar más atrás', async () => {
    // El segundo hábito lleva 70 días; el primero, sólo 2. Se amplía la ventana
    // una vez para los dos, no una por hábito.
    const logs = [...streakLogs('h1', 2), ...streakLogs('h2', 70)]
    listHabits.mockResolvedValue([habit('h1'), habit('h2')])
    listLogsBetween.mockImplementation(async (_userId, fromKey, toKey) =>
      logsBetween(logs, fromKey, toKey),
    )

    const entries = await habitsService.getHabitsToday(USER_ID, TODAY)

    expect(entries.map((entry) => entry.streak)).toEqual([2, 70])
    expect(listLogsBetween).toHaveBeenCalledTimes(2)
  })

  it('la constancia no cuenta días anteriores a la creación del hábito', async () => {
    listHabits.mockResolvedValue([habit('h1', '2026-07-27T10:00:00.000Z')])
    listLogsBetween.mockResolvedValue(streakLogs('h1', 2))

    const [entry] = await habitsService.getHabitsToday(USER_ID, TODAY)

    expect(entry?.consistency).toEqual({ doneDays: 2, totalDays: 3, percent: 67 })
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    listHabits.mockRejectedValue(new Error('column "foo" does not exist'))

    const error: unknown = await habitsService.getHabitsToday(USER_ID, TODAY).catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('column')
  })
})

describe('habitsService.toggleHabit', () => {
  const TODAY_KEY = toDateKey(TODAY)

  it('marcar inserta el registro del día', async () => {
    await habitsService.toggleHabit(USER_ID, 'h1', TODAY_KEY, false)

    expect(insertLog).toHaveBeenCalledExactlyOnceWith({
      user_id: USER_ID,
      habit_id: 'h1',
      date: '2026-07-29',
    })
    expect(deleteLog).not.toHaveBeenCalled()
  })

  it('desmarcar borra el registro en lugar de dejarlo a medias', async () => {
    // Borrado real: el índice único por (hábito, fecha) sólo mira filas vivas,
    // así que una tumba impediría volver a marcar ese mismo día.
    await habitsService.toggleHabit(USER_ID, 'h1', TODAY_KEY, true)

    expect(deleteLog).toHaveBeenCalledExactlyOnceWith('h1', '2026-07-29')
    expect(insertLog).not.toHaveBeenCalled()
  })

  it('marca un día ya pasado, para arreglar el olvido de ayer', async () => {
    await habitsService.toggleHabit(USER_ID, 'h1', '2026-07-27', false)

    expect(insertLog).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-07-27' }))
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    insertLog.mockRejectedValue(new Error('duplicate key value'))

    const error: unknown = await habitsService
      .toggleHabit(USER_ID, 'h1', TODAY_KEY, false)
      .catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('duplicate')
  })
})

describe('habitsService.createHabit', () => {
  it('guarda la descripción vacía como ausencia de dato', async () => {
    insertHabit.mockResolvedValue(habit('h1'))

    await habitsService.createHabit(USER_ID, { name: 'Leer' })

    expect(insertHabit).toHaveBeenCalledExactlyOnceWith({
      user_id: USER_ID,
      name: 'Leer',
      description: null,
    })
  })
})

describe('habitsService.updateHabit', () => {
  it('cambia el nombre y la nota sin tocar nada más', async () => {
    // Ni los registros ni la fecha de creación: son lo que sostiene la racha y
    // la constancia, y corregir una errata no puede costar el historial.
    updateHabit.mockResolvedValue(habit('h1'))

    await habitsService.updateHabit('h1', {
      name: 'Leer 30 minutos',
      description: 'Antes de dormir',
    })

    expect(updateHabit).toHaveBeenCalledExactlyOnceWith('h1', {
      name: 'Leer 30 minutos',
      description: 'Antes de dormir',
    })
  })

  it('una nota vacía se guarda como ausencia, no como texto vacío', async () => {
    updateHabit.mockResolvedValue(habit('h1'))

    await habitsService.updateHabit('h1', { name: 'Leer' })

    expect(updateHabit).toHaveBeenCalledExactlyOnceWith('h1', { name: 'Leer', description: null })
  })
})

describe('habitsService.deleteHabit', () => {
  it('borra el hábito que nunca se llegó a marcar', async () => {
    // El error de tecleo: se creó «adasd», nunca se usó, y sólo se podía archivar.
    countLogs.mockResolvedValue(0)

    await habitsService.deleteHabit('h1')

    expect(deleteHabit).toHaveBeenCalledExactlyOnceWith('h1')
  })

  it('se niega si tiene días marcados, en vez de llevárselos por delante', async () => {
    // La clave ajena es `on delete cascade`: sin esta comprobación, Postgres
    // borraría el historial en silencio.
    countLogs.mockResolvedValue(1)

    const error: unknown = await habitsService.deleteHabit('h1').catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).toMatch(/archívalo/i)
    expect(deleteHabit).not.toHaveBeenCalled()
  })
})

describe('habitsService.archiveHabit', () => {
  it('archiva con una fecha en lugar de borrar, para conservar el historial', async () => {
    updateHabit.mockResolvedValue(habit('h1'))

    await habitsService.archiveHabit('h1')

    const [habitId, patch] = updateHabit.mock.calls[0] ?? []
    expect(habitId).toBe('h1')
    expect(typeof patch?.archived_at).toBe('string')
  })
})

describe('habitsService.restoreHabit', () => {
  it('recuperar sólo quita la fecha de archivado: el historial nunca se tocó', async () => {
    updateHabit.mockResolvedValue(habit('h1'))

    await habitsService.restoreHabit('h1')

    expect(updateHabit).toHaveBeenCalledExactlyOnceWith('h1', { archived_at: null })
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    updateHabit.mockRejectedValue(new Error('violates row-level security policy'))

    const error: unknown = await habitsService.restoreHabit('h1').catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('row-level security')
  })
})

describe('habitsService.getArchivedHabits', () => {
  it('devuelve los archivados tal cual los da el repositorio', async () => {
    const archived = habit('h9')
    listArchivedHabits.mockResolvedValue([archived])

    await expect(habitsService.getArchivedHabits(USER_ID)).resolves.toEqual([archived])
    expect(listArchivedHabits).toHaveBeenCalledExactlyOnceWith(USER_ID)
  })
})
