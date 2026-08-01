import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Recommendation } from '@/decision-engine'

import { planningRepository } from '../repositories/planning.repository'
import { planningService } from './planning.service'

/**
 * El repositorio se sustituye por completo: aquí se comprueban **reglas**, no
 * consultas. Con la factoría el módulo real ni se carga, así que los tests no
 * necesitan las variables de entorno de Supabase (ver la memoria del proyecto).
 */
vi.mock('../repositories/planning.repository', () => ({
  planningRepository: {
    listDismissed: vi.fn(),
    insertDismissed: vi.fn(),
  },
}))

const mocked = vi.mocked(planningRepository)

const RECOMMENDATION: Recommendation = {
  key: 'meal-swap@1:burger',
  type: 'meal_swap',
  domain: 'nutrition',
  priority: 'high',
  title: 'El almuerzo puede salir más barato',
  message: 'La próxima vez, lentejas.',
  reason: 'La hamburguesa costó $ 18.000.',
  data: { savingCop: 15725 },
}

const NOW = new Date(2026, 7, 1, 14, 30)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getDismissedKeys', () => {
  it('lee la clave que quedó guardada en la carga', async () => {
    mocked.listDismissed.mockResolvedValue([
      { id: '1', data: { ruleKey: 'water-pending@1' } },
      { id: '2', data: { ruleKey: 'meal-swap@1:burger', savingCop: 15725 } },
    ])

    await expect(planningService.getDismissedKeys('u1', NOW)).resolves.toEqual([
      'water-pending@1',
      'meal-swap@1:burger',
    ])
  })

  it('descarta las filas sin clave en vez de romperse', async () => {
    // `data` es JSON libre: una fila vieja puede no traerla.
    mocked.listDismissed.mockResolvedValue([
      { id: '1', data: { otraCosa: true } },
      { id: '2', data: null },
      { id: '3', data: 'texto' },
      { id: '4', data: { ruleKey: 'sleep-short@1' } },
    ])

    await expect(planningService.getDismissedKeys('u1', NOW)).resolves.toEqual(['sleep-short@1'])
  })

  it('sólo pide los descartes que siguen vigentes', async () => {
    mocked.listDismissed.mockResolvedValue([])

    await planningService.getDismissedKeys('u1', NOW)

    expect(mocked.listDismissed).toHaveBeenCalledWith('u1', NOW.toISOString())
  })

  it('traduce el error técnico a uno del dominio', async () => {
    mocked.listDismissed.mockRejectedValue(new Error('fetch failed'))

    await expect(planningService.getDismissedKeys('u1', NOW)).rejects.toMatchObject({
      code: expect.any(String),
    })
  })
})

describe('dismiss', () => {
  it('guarda la clave dentro de la carga, junto a sus datos', async () => {
    mocked.insertDismissed.mockResolvedValue(undefined)

    await planningService.dismiss('u1', RECOMMENDATION, NOW)

    expect(mocked.insertDismissed).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        status: 'dismissed',
        type: 'meal_swap',
        data: { savingCop: 15725, ruleKey: 'meal-swap@1:burger' },
      }),
    )
  })

  it('el descarte caduca a medianoche: dice «hoy no», no «nunca más»', async () => {
    mocked.insertDismissed.mockResolvedValue(undefined)

    await planningService.dismiss('u1', RECOMMENDATION, NOW)

    const [input] = mocked.insertDismissed.mock.calls[0] ?? []

    expect(input?.valid_until).toBe(new Date(2026, 7, 2).toISOString())
  })

  it('omite el dominio cuando la recomendación no lo tiene', async () => {
    mocked.insertDismissed.mockResolvedValue(undefined)
    const { domain: _domain, ...sinDominio } = RECOMMENDATION

    await planningService.dismiss('u1', sinDominio, NOW)

    const [input] = mocked.insertDismissed.mock.calls[0] ?? []

    expect(input).not.toHaveProperty('domain')
  })
})
