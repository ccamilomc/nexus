import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAppError } from '@/core/error'

import { healthRepository } from '../repositories/health.repository'
import type { BodyMetric, BodyMetricType } from '../types/health.types'
import { healthService } from './health.service'

/**
 * El repositorio se sustituye por completo: estos tests comprueban **reglas de
 * negocio**, no consultas. Con la factoría, el módulo real ni siquiera se carga,
 * así que no arrastra el cliente de Supabase (ni sus variables de entorno).
 */
vi.mock('../repositories/health.repository', () => ({
  healthRepository: {
    listRecentMetrics: vi.fn(),
    insertMetrics: vi.fn(),
    softDeleteMetric: vi.fn(),
    findHeightCm: vi.fn(),
    updateHeightCm: vi.fn(),
  },
}))

const listRecentMetrics = vi.mocked(healthRepository.listRecentMetrics)
const insertMetrics = vi.mocked(healthRepository.insertMetrics)
const findHeightCm = vi.mocked(healthRepository.findHeightCm)

const USER_ID = 'user-1'

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
  findHeightCm.mockResolvedValue(175)
  insertMetrics.mockResolvedValue([metric('weight', 74.5, '2026-07-31T08:00:00.000Z')])
})

describe('healthService.getOverview', () => {
  it('sin mediciones no hay resumen ni IMC', async () => {
    const overview = await healthService.getOverview(USER_ID)

    expect(overview.metrics).toEqual([])
    expect(overview.bmi).toBeNull()
  })

  it('calcula el IMC con el último peso y la altura del perfil', async () => {
    listRecentMetrics.mockResolvedValue([metric('weight', 70, '2026-07-31T08:00:00.000Z')])

    const overview = await healthService.getOverview(USER_ID)

    expect(overview.bmi).toEqual({ value: 22.9, category: 'Peso normal' })
    expect(overview.heightCm).toBe(175)
  })

  it('sin altura no muestra IMC, pero sí las medidas', async () => {
    // Inventar un IMC sería peor que no mostrarlo.
    findHeightCm.mockResolvedValue(null)
    listRecentMetrics.mockResolvedValue([metric('weight', 70, '2026-07-31T08:00:00.000Z')])

    const overview = await healthService.getOverview(USER_ID)

    expect(overview.bmi).toBeNull()
    expect(overview.metrics).toHaveLength(1)
  })

  it('con medidas pero sin peso tampoco hay IMC', async () => {
    listRecentMetrics.mockResolvedValue([metric('waist', 82, '2026-07-31T08:00:00.000Z')])

    const overview = await healthService.getOverview(USER_ID)

    expect(overview.bmi).toBeNull()
    expect(overview.metrics).toHaveLength(1)
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    listRecentMetrics.mockRejectedValue(new Error('violates row-level security policy'))

    const error: unknown = await healthService.getOverview(USER_ID).catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('row-level security')
  })
})

describe('healthService.logMeasurements', () => {
  const HOY = new Date(2026, 7, 14, 9, 30)

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
