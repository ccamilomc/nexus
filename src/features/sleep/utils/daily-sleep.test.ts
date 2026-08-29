import { describe, expect, it } from 'vitest'

import type { SleepDaySample, SleepLog } from '../types/sleep.types'
import { napsOn, nightsOnly, totalMinutesByDate } from './daily-sleep'

const muestra = (
  date: string,
  duration_minutes: number,
  kind: SleepLog['kind'] = 'night',
): SleepDaySample => ({ date, duration_minutes, quality_rating: null, kind })

function registro(overrides: Partial<SleepLog> = {}): SleepLog {
  return {
    id: crypto.randomUUID(),
    user_id: 'u1',
    date: '2026-08-28',
    kind: 'night',
    bedtime: '2026-08-27T23:30:00.000Z',
    wake_time: '2026-08-28T07:00:00.000Z',
    duration_minutes: 450,
    quality_rating: null,
    interruptions: 0,
    notes: null,
    created_at: '2026-08-28T07:05:00.000Z',
    updated_at: '2026-08-28T07:05:00.000Z',
    deleted_at: null,
    ...overrides,
  }
}

describe('totalMinutesByDate', () => {
  it('suma la noche y la siesta del mismo día', () => {
    // El caso que lo empezó todo: seis de noche y tres de tarde son nueve, no
    // tres. Antes esto era un Map que se quedaba con el último y callaba.
    const total = totalMinutesByDate([
      muestra('2026-08-28', 360),
      muestra('2026-08-28', 180, 'nap'),
    ])

    expect(total.get('2026-08-28')).toBe(540)
  })

  it('suma varias siestas', () => {
    const total = totalMinutesByDate([
      muestra('2026-08-28', 300),
      muestra('2026-08-28', 45, 'nap'),
      muestra('2026-08-28', 60, 'nap'),
    ])

    expect(total.get('2026-08-28')).toBe(405)
  })

  it('cada día por su lado', () => {
    const total = totalMinutesByDate([muestra('2026-08-27', 400), muestra('2026-08-28', 300)])

    expect(total.get('2026-08-27')).toBe(400)
    expect(total.get('2026-08-28')).toBe(300)
  })

  it('un día sin nada no aparece', () => {
    // Es distinto de dormir cero: no hay registro, no hay dato.
    expect(totalMinutesByDate([]).size).toBe(0)
  })
})

describe('nightsOnly', () => {
  it('deja fuera las siestas', () => {
    const soloNoches = nightsOnly([
      registro(),
      registro({ kind: 'nap' }),
      registro({ date: '2026-08-27' }),
    ])

    expect(soloNoches).toHaveLength(2)
    expect(soloNoches.every((log) => log.kind === 'night')).toBe(true)
  })
})

describe('napsOn', () => {
  it('las siestas de ese día, de la más temprana a la más tardía', () => {
    const siestas = napsOn(
      [
        registro(),
        registro({ kind: 'nap', bedtime: '2026-08-28T20:00:00.000Z' }),
        registro({ kind: 'nap', bedtime: '2026-08-28T18:00:00.000Z' }),
        registro({ kind: 'nap', date: '2026-08-27' }),
      ],
      '2026-08-28',
    )

    expect(siestas).toHaveLength(2)
    expect(siestas[0]?.bedtime).toContain('18:00')
  })
})

describe('la media del historial, con siestas de por medio', () => {
  it('promedia por día y no por registro', async () => {
    // Seis de noche más tres de siesta son dos filas. Promediarlas daría
    // 4 h 30 min para un día en el que se durmieron nueve horas.
    const { buildSleepHistory } = await import('./sleep-history')

    const historial = buildSleepHistory([
      registro({ duration_minutes: 360 }),
      registro({ kind: 'nap', duration_minutes: 180 }),
    ])

    expect(historial.averageMinutes).toBe(540)
  })

  it('dos días se promedian entre ellos', async () => {
    const { buildSleepHistory } = await import('./sleep-history')

    const historial = buildSleepHistory([
      registro({ date: '2026-08-27', duration_minutes: 480 }),
      registro({ date: '2026-08-28', duration_minutes: 360 }),
      registro({ date: '2026-08-28', kind: 'nap', duration_minutes: 120 }),
    ])

    expect(historial.averageMinutes).toBe(480)
  })
})
