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
    listMetricHistory: vi.fn(),
    insertMetric: vi.fn(),
    softDeleteMetric: vi.fn(),
    findHeightCm: vi.fn(),
    updateHeightCm: vi.fn(),
  },
}))

const listRecentMetrics = vi.mocked(healthRepository.listRecentMetrics)
const insertMetric = vi.mocked(healthRepository.insertMetric)
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
  insertMetric.mockResolvedValue(metric('weight', 74.5, '2026-07-31T08:00:00.000Z'))
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

describe('healthService.logMetric', () => {
  it('pone la unidad que corresponde a la medida', async () => {
    await healthService.logMetric(USER_ID, { metricType: 'weight', value: 74.5 })

    expect(insertMetric).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, metric_type: 'weight', value: 74.5, unit: 'kg' }),
    )
  })

  it('las medidas de contorno van en centímetros', async () => {
    await healthService.logMetric(USER_ID, { metricType: 'waist', value: 82 })

    expect(insertMetric).toHaveBeenCalledWith(expect.objectContaining({ unit: 'cm' }))
  })

  it('la grasa corporal va en porcentaje', async () => {
    await healthService.logMetric(USER_ID, { metricType: 'body_fat', value: 18 })

    expect(insertMetric).toHaveBeenCalledWith(expect.objectContaining({ unit: '%' }))
  })

  it('fecha la medición en el momento de registrarla', async () => {
    vi.useFakeTimers()
    const now = new Date(2026, 6, 31, 8, 30)
    vi.setSystemTime(now)

    await healthService.logMetric(USER_ID, { metricType: 'weight', value: 74.5 })

    expect(insertMetric).toHaveBeenCalledWith(
      expect.objectContaining({ measured_at: now.toISOString() }),
    )

    vi.useRealTimers()
  })
})
