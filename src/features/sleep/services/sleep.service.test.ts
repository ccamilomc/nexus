import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAppError } from '@/core/error'

import { sleepRepository } from '../repositories/sleep.repository'
import type { SleepLog } from '../types/sleep.types'
import { sleepService } from './sleep.service'

/**
 * El repositorio se sustituye por completo: estos tests comprueban **reglas de
 * negocio**, no consultas. Con la factoría, el módulo real ni siquiera se carga,
 * así que no arrastra el cliente de Supabase (ni sus variables de entorno).
 */
vi.mock('../repositories/sleep.repository', () => ({
  sleepRepository: {
    listRecentLogs: vi.fn(),
    findNightByDate: vi.fn(),
    insertLog: vi.fn(),
    updateLog: vi.fn(),
    softDeleteLog: vi.fn(),
  },
}))

const listRecentLogs = vi.mocked(sleepRepository.listRecentLogs)
const findNightByDate = vi.mocked(sleepRepository.findNightByDate)
const insertLog = vi.mocked(sleepRepository.insertLog)
const updateLog = vi.mocked(sleepRepository.updateLog)

const USER_ID = 'user-1'
/** Viernes 31 de julio de 2026, por la mañana. */
const TODAY = new Date(2026, 6, 31, 8, 0)
/** La misma fecha como la manda el formulario: la mañana en que se despertó. */
const TODAY_KEY = '2026-07-31'

function log(date: string, minutes: number, quality: number | null = null): SleepLog {
  return {
    id: `log-${date}`,
    user_id: USER_ID,
    date,
    bedtime: '23:00:00',
    wake_time: '07:00:00',
    duration_minutes: minutes,
    quality_rating: quality,
    kind: 'night' as const,
    interruptions: 0,
    notes: null,
    created_at: `${date}T07:30:00.000Z`,
    updated_at: `${date}T07:30:00.000Z`,
    deleted_at: null,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  listRecentLogs.mockResolvedValue([])
  findNightByDate.mockResolvedValue(null)
  insertLog.mockResolvedValue(log('2026-07-31', 480))
  updateLog.mockResolvedValue(log('2026-07-31', 480))
})

describe('sleepService.logSleep', () => {
  // Las horas se convierten al armar el registro, y se prueban en
  // `utils/sleep-input.test.ts`: aqui llegan resueltas porque la noche puede
  // haber esperado sin red y salir despues (ADR-0011).
  const INPUT = {
    id: 'n-nueva',
    userId: USER_ID,
    dateKey: TODAY_KEY,
    kind: 'night' as const,
    bedtimeIso: new Date(2026, 6, 30, 23, 30).toISOString(),
    wakeTimeIso: new Date(2026, 6, 31, 7, 0).toISOString(),
    minutes: 450,
    qualityRating: null,
  }

  it('guarda la noche con el id que trae, para que reenviarla no duplique', async () => {
    await sleepService.logSleep(INPUT)

    expect(insertLog).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'n-nueva',
        user_id: USER_ID,
        date: '2026-07-31',
        duration_minutes: 450,
        bedtime: INPUT.bedtimeIso,
        wake_time: INPUT.wakeTimeIso,
      }),
    )
  })

  it('corrige la noche en lugar de duplicarla', async () => {
    // Una noche solo se duerme una vez: volver a la pantalla debe corregir.
    findNightByDate.mockResolvedValue(log('2026-07-31', 480))

    await sleepService.logSleep(INPUT)

    expect(insertLog).not.toHaveBeenCalled()
    expect(updateLog).toHaveBeenCalledWith(
      'log-2026-07-31',
      expect.objectContaining({ duration_minutes: 450 }),
    )
  })

  it('guarda la valoracion cuando se da', async () => {
    await sleepService.logSleep({ ...INPUT, qualityRating: 4 })

    expect(insertLog).toHaveBeenCalledWith(expect.objectContaining({ quality_rating: 4 }))
  })

  it('guarda la clase que se le pide, no la que ponga la base', async () => {
    // Sin `kind` en el insert, Postgres pone su valor por defecto —noche— y una
    // siesta acababa guardada como noche, pisando la de ese dia. Paso de verdad.
    await sleepService.logSleep({ ...INPUT, kind: 'nap' })

    expect(insertLog).toHaveBeenCalledWith(expect.objectContaining({ kind: 'nap' }))
  })

  it('una siesta se suma: no busca ni corrige nada', async () => {
    // Se pueden echar dos en un dia, y la segunda no sustituye a la primera.
    findNightByDate.mockResolvedValue(log('2026-07-31', 480))

    await sleepService.logSleep({ ...INPUT, kind: 'nap', minutes: 90 })

    expect(findNightByDate).not.toHaveBeenCalled()
    expect(updateLog).not.toHaveBeenCalled()
    expect(insertLog).toHaveBeenCalledWith(expect.objectContaining({ duration_minutes: 90 }))
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    insertLog.mockRejectedValue(new Error('violates row-level security policy'))

    const error: unknown = await sleepService.logSleep(INPUT).catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('row-level security')
  })
})

describe('sleepService.getHistory', () => {
  it('promedia lo dormido en las últimas noches', async () => {
    listRecentLogs.mockResolvedValue([log('2026-07-31', 480), log('2026-07-30', 420)])

    const history = await sleepService.getHistory(USER_ID)

    expect(history.averageMinutes).toBe(450)
  })

  it('la media de calidad ignora las noches sin valorar', async () => {
    // Puntuar es opcional: contar «sin valorar» como cero hundiría la media.
    listRecentLogs.mockResolvedValue([
      log('2026-07-31', 480, 4),
      log('2026-07-30', 420, null),
      log('2026-07-29', 400, 2),
    ])

    const history = await sleepService.getHistory(USER_ID)

    expect(history.averageQuality).toBe(3)
  })

  it('sin noches registradas no inventa medias', async () => {
    const history = await sleepService.getHistory(USER_ID)

    expect(history).toEqual({ logs: [], averageMinutes: null, averageQuality: null })
  })
})

describe('sleepService.getLastNight', () => {
  it('busca la noche por la fecha de hoy', async () => {
    await sleepService.getLastNight(USER_ID, TODAY)

    expect(findNightByDate).toHaveBeenCalledExactlyOnceWith(USER_ID, '2026-07-31')
  })
})
