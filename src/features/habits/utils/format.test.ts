import { describe, expect, it } from 'vitest'

import { parseDateKey } from '@/shared/utils'

import { describeWeekdays, formatDayAndMonth, weekdayInitial } from './format'

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

describe('describeWeekdays', () => {
  it('un hábito diario no dice nada', () => {
    // Escribir «todos los días» en cada tarjeta sería repetir siete veces algo
    // que no distingue a ninguna.
    expect(describeWeekdays(null)).toBeNull()
    expect(describeWeekdays([])).toBeNull()
  })

  it('marcar los siete también es diario', () => {
    expect(describeWeekdays([1, 2, 3, 4, 5, 6, 7])).toBeNull()
  })

  it('enumera con «y» al final, como se dice', () => {
    expect(describeWeekdays([1, 3, 5])).toBe('Lunes, miércoles y viernes')
  })

  it('un solo día no lleva «y»', () => {
    expect(describeWeekdays([7])).toBe('Domingo')
  })

  it('los ordena aunque lleguen desordenados', () => {
    // Marcar viernes y luego lunes no puede leerse «Viernes y lunes».
    expect(describeWeekdays([5, 1])).toBe('Lunes y viernes')
  })
})
