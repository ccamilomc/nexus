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
    findLogByDate: vi.fn(),
    insertLog: vi.fn(),
    updateLog: vi.fn(),
    softDeleteLog: vi.fn(),
  },
}))

const listRecentLogs = vi.mocked(sleepRepository.listRecentLogs)
const findLogByDate = vi.mocked(sleepRepository.findLogByDate)
const insertLog = vi.mocked(sleepRepository.insertLog)
const updateLog = vi.mocked(sleepRepository.updateLog)

const USER_ID = 'user-1'
/** Viernes 31 de julio de 2026, por la mañana. */
const TODAY = new Date(2026, 6, 31, 8, 0)

function log(date: string, minutes: number, quality: number | null = null): SleepLog {
  return {
    id: `log-${date}`,
    user_id: USER_ID,
    date,
    bedtime: '23:00:00',
    wake_time: '07:00:00',
    duration_minutes: minutes,
    quality_rating: quality,
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
  findLogByDate.mockResolvedValue(null)
  insertLog.mockResolvedValue(log('2026-07-31', 480))
  updateLog.mockResolvedValue(log('2026-07-31', 480))
})

describe('sleepService.logSleep', () => {
  it('calcula la duración cruzando la medianoche', async () => {
    await sleepService.logSleep(USER_ID, TODAY, { bedtime: '23:30', wakeTime: '07:00' })

    expect(insertLog).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, duration_minutes: 450 }),
    )
  })

  it('guarda instantes, no horas sueltas: la acostada fue el día anterior', () => {
    // Las columnas son `timestamptz`; enviar «23:30» reventaba contra la base.
    void sleepService.logSleep(USER_ID, TODAY, { bedtime: '23:30', wakeTime: '07:00' })

    return vi.waitFor(() => {
      expect(insertLog).toHaveBeenCalledWith(
        expect.objectContaining({
          bedtime: new Date(2026, 6, 30, 23, 30).toISOString(),
          wake_time: new Date(2026, 6, 31, 7, 0).toISOString(),
        }),
      )
    })
  })

  it('guarda la noche con la fecha del día en que se despierta', async () => {
    // Al abrir la aplicación por la mañana, «anoche» es el registro de hoy.
    await sleepService.logSleep(USER_ID, TODAY, { bedtime: '23:00', wakeTime: '07:00' })

    expect(insertLog).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-07-31' }))
  })

  it('corrige la noche en lugar de duplicarla', async () => {
    // Una noche sólo se duerme una vez: volver a la pantalla debe corregir.
    findLogByDate.mockResolvedValue(log('2026-07-31', 480))

    await sleepService.logSleep(USER_ID, TODAY, { bedtime: '00:30', wakeTime: '06:30' })

    expect(insertLog).not.toHaveBeenCalled()
    expect(updateLog).toHaveBeenCalledWith(
      'log-2026-07-31',
      expect.objectContaining({ duration_minutes: 360 }),
    )
  })

  it('sin valoración guarda ausencia de dato, no un cero', async () => {
    await sleepService.logSleep(USER_ID, TODAY, { bedtime: '23:00', wakeTime: '07:00' })

    expect(insertLog).toHaveBeenCalledWith(expect.objectContaining({ quality_rating: null }))
  })

  it('guarda la valoración cuando se da', async () => {
    await sleepService.logSleep(USER_ID, TODAY, {
      bedtime: '23:00',
      wakeTime: '07:00',
      qualityRating: 4,
    })

    expect(insertLog).toHaveBeenCalledWith(expect.objectContaining({ quality_rating: 4 }))
  })

  it('con horas imposibles avisa en cristiano y no guarda nada', async () => {
    const error: unknown = await sleepService
      .logSleep(USER_ID, TODAY, { bedtime: '99:99', wakeTime: '07:00' })
      .catch((e) => e)

    expect(error).toEqual({ code: 'validation', message: 'Revisa las horas: no son válidas.' })
    expect(insertLog).not.toHaveBeenCalled()
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    insertLog.mockRejectedValue(new Error('violates row-level security policy'))

    const error: unknown = await sleepService
      .logSleep(USER_ID, TODAY, { bedtime: '23:00', wakeTime: '07:00' })
      .catch((e) => e)

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

    expect(findLogByDate).toHaveBeenCalledExactlyOnceWith(USER_ID, '2026-07-31')
  })
})
