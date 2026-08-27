import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAppError } from '@/core/error'
import { profileService } from '@/features/profile'

import { healthRepository } from '../repositories/health.repository'
import type { BodyMetric, BodyMetricType } from '../types/health.types'
import { healthService } from './health.service'

/**
 * El repositorio se sustituye por completo: estos tests comprueban **reglas de
 * negocio**, no consultas. Con la factoría, el módulo real ni siquiera se carga,
 * así que no arrastra el cliente de Supabase (ni sus variables de entorno).
 */
// El perfil ya no lo lee salud: lo lee su feature (ver profile.service).
vi.mock('@/features/profile', () => ({ profileService: { get: vi.fn(), save: vi.fn() } }))

vi.mock('../repositories/health.repository', () => ({
  healthRepository: {
    listRecentMetrics: vi.fn(),
    listMetricsBetween: vi.fn(),
    insertMetrics: vi.fn(),
    softDeleteMetric: vi.fn(),
  },
}))

const listRecentMetrics = vi.mocked(healthRepository.listRecentMetrics)
const listMetricsBetween = vi.mocked(healthRepository.listMetricsBetween)
const insertMetrics = vi.mocked(healthRepository.insertMetrics)
const getProfile = vi.mocked(profileService.get)

const USER_ID = 'user-1'
const HOY = new Date(2026, 7, 14, 9, 30)

function metric(type: BodyMetricType, value: number, measuredAt: string): BodyMetric {
  return {
    id: `${type}-${measuredAt}`,
    user_id: USER_ID,
    metric_type: type,
    value,
    unit: type === 'weight' ? 'kg' : 'cm',
    measured_at: measuredAt,
    created_at: measuredAt,
    updated_at: measuredAt,
    deleted_at: null,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  listRecentMetrics.mockResolvedValue([])
  listMetricsBetween.mockResolvedValue([])
  getProfile.mockResolvedValue({ height_cm: 175 } as never)
  insertMetrics.mockResolvedValue([metric('weight', 74.5, '2026-07-31T08:00:00.000Z')])
})

describe('healthService.getOverview', () => {
  it('sin mediciones no hay resumen ni IMC', async () => {
    const overview = await healthService.getOverview(USER_ID, HOY)

    expect(overview.metrics).toEqual([])
    expect(overview.bmi).toBeNull()
  })

  it('calcula el IMC con el último peso y la altura del perfil', async () => {
    listRecentMetrics.mockResolvedValue([metric('weight', 70, '2026-07-31T08:00:00.000Z')])

    const overview = await healthService.getOverview(USER_ID, HOY)

    expect(overview.bmi).toEqual({ value: 22.9, category: 'Peso normal' })
    expect(overview.heightCm).toBe(175)
  })

  it('sin altura no muestra IMC, pero sí las medidas', async () => {
    // Inventar un IMC sería peor que no mostrarlo.
    getProfile.mockResolvedValue(null)
    listRecentMetrics.mockResolvedValue([metric('weight', 70, '2026-07-31T08:00:00.000Z')])

    const overview = await healthService.getOverview(USER_ID, HOY)

    expect(overview.bmi).toBeNull()
    expect(overview.metrics).toHaveLength(1)
  })

  it('con medidas pero sin peso tampoco hay IMC', async () => {
    listRecentMetrics.mockResolvedValue([metric('waist', 82, '2026-07-31T08:00:00.000Z')])

    const overview = await healthService.getOverview(USER_ID, HOY)

    expect(overview.bmi).toBeNull()
    expect(overview.metrics).toHaveLength(1)
  })

  it('trae la tendencia del peso de las últimas cuatro semanas', async () => {
    listMetricsBetween.mockResolvedValue([
      metric('weight', 91.2, new Date(2026, 6, 20, 12).toISOString()),
      metric('weight', 90.8, new Date(2026, 6, 28, 12).toISOString()),
      metric('weight', 90.2, new Date(2026, 7, 5, 12).toISOString()),
      metric('weight', 89.8, new Date(2026, 7, 12, 12).toISOString()),
    ])

    const overview = await healthService.getOverview(USER_ID, HOY)

    expect(overview.weightTrend?.direction).toBe('down')
    expect(listMetricsBetween).toHaveBeenCalledWith(
      USER_ID,
      'weight',
      expect.any(String),
      expect.any(String),
    )
  })

  it('sin pesadas suficientes no da tendencia en vez de inventarla', async () => {
    listMetricsBetween.mockResolvedValue([
      metric('weight', 90, new Date(2026, 7, 12, 12).toISOString()),
    ])

    const overview = await healthService.getOverview(USER_ID, HOY)

    expect(overview.weightTrend).toBeNull()
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    listRecentMetrics.mockRejectedValue(new Error('violates row-level security policy'))

    const error: unknown = await healthService.getOverview(USER_ID, HOY).catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('row-level security')
  })
})

describe('healthService.logMeasurements', () => {
  it('guarda sólo las que se rellenaron, con su unidad', async () => {
    // Vacío es «no me lo medí», no cero.
    await healthService.logMeasurements(
      USER_ID,
      { date: '2026-08-14', values: { weight: 74.5, waist: 82, body_fat: 18 } },
      HOY,
    )

    const [rows] = insertMetrics.mock.calls[0] ?? []

    expect(rows).toHaveLength(3)
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric_type: 'weight', value: 74.5, unit: 'kg' }),
        expect.objectContaining({ metric_type: 'waist', value: 82, unit: 'cm' }),
        expect.objectContaining({ metric_type: 'body_fat', value: 18, unit: '%' }),
      ]),
    )
  })

  it('una sola escritura para toda la vuelta de cinta métrica', async () => {
    // De una en una serían cinco viajes, y podrían quedarse a medias.
    await healthService.logMeasurements(
      USER_ID,
      { date: '2026-08-14', values: { waist: 82, hip: 95, chest: 104, arm: 36, thigh: 58 } },
      HOY,
    )

    expect(insertMetrics).toHaveBeenCalledOnce()
    expect(insertMetrics.mock.calls[0]?.[0]).toHaveLength(5)
  })

  it('un día pasado se fecha a su mediodía, no en el momento de apuntarlo', async () => {
    await healthService.logMeasurements(
      USER_ID,
      { date: '2026-08-12', values: { weight: 74 } },
      HOY,
    )

    const medida = insertMetrics.mock.calls[0]?.[0]?.[0]
    const fecha = new Date(medida?.measured_at ?? '')

    expect(fecha.getDate()).toBe(12)
    expect(fecha.getHours()).toBe(12)
  })

  it('avisa en vez de inventarse una fecha que no se entiende', async () => {
    const error: unknown = await healthService
      .logMeasurements(USER_ID, { date: '', values: { weight: 74 } }, HOY)
      .catch((e: unknown) => e)

    expect(isAppError(error)).toBe(true)
    expect(insertMetrics).not.toHaveBeenCalled()
  })
})
