import { describe, expect, it } from 'vitest'

import type { SleepDaySample } from '../types/sleep.types'
import { buildSleepSeries } from './sleep-series'

const DAYS = [new Date(2026, 6, 27), new Date(2026, 6, 28), new Date(2026, 6, 29)]
const PREVIOUS_DAYS = [new Date(2026, 6, 24), new Date(2026, 6, 25), new Date(2026, 6, 26)]

function night(date: string, minutes: number, quality: number | null = null): SleepDaySample {
  return { date, duration_minutes: minutes, quality_rating: quality }
}

describe('buildSleepSeries', () => {
  it('coloca cada noche en su día', () => {
    const series = buildSleepSeries([night('2026-07-27', 420), night('2026-07-29', 480)], DAYS, [])

    expect(series.points).toEqual([
      { dateKey: '2026-07-27', value: 420 },
      { dateKey: '2026-07-28', value: null },
      { dateKey: '2026-07-29', value: 480 },
    ])
  })

  it('la media sale de las noches registradas, no de los días del periodo', () => {
    const series = buildSleepSeries([night('2026-07-27', 420), night('2026-07-29', 480)], DAYS, [])

    expect(series.averageMinutes).toBe(450)
    expect(series.nightsLogged).toBe(2)
  })

  it('separa el tramo anterior del actual', () => {
    const samples = [night('2026-07-25', 360), night('2026-07-28', 480)]

    const series = buildSleepSeries(samples, DAYS, PREVIOUS_DAYS)

    expect(series.averageMinutes).toBe(480)
    expect(series.previousAverageMinutes).toBe(360)
  })

  it('sin noches no inventa medias', () => {
    const series = buildSleepSeries([], DAYS, PREVIOUS_DAYS)

    expect(series.averageMinutes).toBeNull()
    expect(series.previousAverageMinutes).toBeNull()
    expect(series.averageQuality).toBeNull()
    expect(series.nightsLogged).toBe(0)
  })

  it('la calidad promedia sólo las noches valoradas', () => {
    // Tres noches dormidas, dos puntuadas: la media es de esas dos.
    const samples = [
      night('2026-07-27', 420, 4),
      night('2026-07-28', 400),
      night('2026-07-29', 480, 5),
    ]

    const series = buildSleepSeries(samples, DAYS, [])

    expect(series.averageQuality).toBe(4.5)
    expect(series.nightsLogged).toBe(3)
  })

  it('la calidad del tramo anterior no contamina la del actual', () => {
    const samples = [night('2026-07-25', 360, 1), night('2026-07-28', 480, 5)]

    const series = buildSleepSeries(samples, DAYS, PREVIOUS_DAYS)

    expect(series.averageQuality).toBe(5)
  })
})
