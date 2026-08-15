import { describe, expect, it } from 'vitest'

import { parseDateKey } from '@/shared/utils'

import { formatDayAndMonth, weekdayInitial } from './format'

describe('weekdayInitial', () => {
  it('usa la equis del miércoles para no confundirlo con el martes', () => {
    expect(weekdayInitial(parseDateKey('2026-07-28'))).toBe('M')
    expect(weekdayInitial(parseDateKey('2026-07-29'))).toBe('X')
  })

  it('cubre la semana entera', () => {
    const week = ['2026-07-26', '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30']

    expect(week.map((key) => weekdayInitial(parseDateKey(key)))).toEqual(['D', 'L', 'M', 'X', 'J'])
  })
})

describe('formatDayAndMonth', () => {
  it('escribe el día en palabras, para quien lo escucha', () => {
    expect(formatDayAndMonth(parseDateKey('2026-07-29'))).toBe('29 de julio')
  })

  it('funciona en cualquier mes', () => {
    expect(formatDayAndMonth(parseDateKey('2026-01-01'))).toBe('1 de enero')
  })
})
