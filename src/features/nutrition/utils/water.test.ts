import { describe, expect, it } from 'vitest'

import type { WaterLog } from '../types/nutrition.types'
import { sumWaterMl } from './water'

function log(amountMl: number): WaterLog {
  return {
    id: `log-${amountMl}`,
    user_id: 'user-1',
    amount_ml: amountMl,
    logged_at: '2026-07-25T12:00:00.000Z',
    created_at: '2026-07-25T12:00:00.000Z',
    updated_at: '2026-07-25T12:00:00.000Z',
    deleted_at: null,
  }
}

describe('sumWaterMl', () => {
  it('suma los registros del día', () => {
    expect(sumWaterMl([log(250), log(500), log(250)])).toBe(1000)
  })

  it('un día sin registros suma cero', () => {
    expect(sumWaterMl([])).toBe(0)
  })
})
