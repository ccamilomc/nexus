import { describe, expect, it } from 'vitest'

import { toDateKey } from './date-key'
import { buildDailySeries, countDaysWithData, seriesAverage, seriesTotal } from './series'

const DAYS = [new Date(2026, 6, 27), new Date(2026, 6, 28), new Date(2026, 6, 29)]

describe('buildDailySeries', () => {
  it('coloca cada valor en su día', () => {
    const values = new Map([
      ['2026-07-27', 420],
      ['2026-07-29', 480],
    ])

    expect(buildDailySeries(DAYS, values, toDateKey)).toEqual([
      { dateKey: '2026-07-27', value: 420 },
      { dateKey: '2026-07-28', value: null },
      { dateKey: '2026-07-29', value: 480 },
    ])
  })

  it('los días sin registro entran como hueco, no se omiten', () => {
    const series = buildDailySeries(DAYS, new Map(), toDateKey)

    expect(series).toHaveLength(3)
    expect(series.every(({ value }) => value === null)).toBe(true)
  })

  it('distingue un cero real de un hueco', () => {
    const series = buildDailySeries(DAYS, new Map([['2026-07-28', 0]]), toDateKey)

    expect(series[1]).toEqual({ dateKey: '2026-07-28', value: 0 })
    expect(series[0]?.value).toBeNull()
  })
})

describe('seriesTotal', () => {
  it('suma los días con dato', () => {
    const series = buildDailySeries(
      DAYS,
      new Map([
        ['2026-07-27', 1200],
        ['2026-07-29', 800],
      ]),
      toDateKey,
    )

    expect(seriesTotal(series)).toBe(2000)
  })

  it('un periodo entero sin datos suma cero', () => {
    expect(seriesTotal(buildDailySeries(DAYS, new Map(), toDateKey))).toBe(0)
  })
})

describe('seriesAverage', () => {
  it('divide entre los días con registro, no entre los del periodo', () => {
    // Dos noches de 8 h en un periodo de 3 días son una media de 8 h, no de
    // 5h20: la noche que no se apuntó no es una noche sin dormir.
    const series = buildDailySeries(
      DAYS,
      new Map([
        ['2026-07-27', 480],
        ['2026-07-29', 480],
      ]),
      toDateKey,
    )

    expect(seriesAverage(series)).toBe(480)
  })

  it('sin ningún registro no hay media que dar', () => {
    expect(seriesAverage(buildDailySeries(DAYS, new Map(), toDateKey))).toBeNull()
  })

  it('un cero registrado sí cuenta en la media', () => {
    const series = buildDailySeries(
      DAYS,
      new Map([
        ['2026-07-27', 100],
        ['2026-07-28', 0],
      ]),
      toDateKey,
    )

    expect(seriesAverage(series)).toBe(50)
  })
})

describe('countDaysWithData', () => {
  it('cuenta sólo los días con registro', () => {
    const series = buildDailySeries(DAYS, new Map([['2026-07-28', 0]]), toDateKey)

    expect(countDaysWithData(series)).toBe(1)
  })
})
