import { describe, expect, it } from 'vitest'

import { weeklyPace } from './weekly-pace'

/** Lunes 10 de agosto de 2026; el resto de días se derivan de ahí. */
const MONDAY = new Date(2026, 7, 10, 9, 0, 0)
const day = (offset: number) => new Date(2026, 7, 10 + offset, 9, 0, 0)

describe('weeklyPace', () => {
  it('reparte lo que falta entre la semana entera si es lunes', () => {
    expect(weeklyPace(700, MONDAY)).toEqual({ daysLeft: 7, perDayMinutes: 100 })
  })

  it('cuenta el día de hoy: el sábado quedan dos días, no uno', () => {
    expect(weeklyPace(120, day(5))).toEqual({ daysLeft: 2, perDayMinutes: 60 })
  })

  it('el domingo es el último día, y ahí el ritmo es todo lo que falta', () => {
    expect(weeklyPace(90, day(6))).toEqual({ daysLeft: 1, perDayMinutes: 90 })
  })

  it('redondea hacia arriba: a 99 min en 2 días no se llega con 49', () => {
    expect(weeklyPace(99, day(5))?.perDayMinutes).toBe(50)
  })

  it('no calcula ritmo si ya se cumplió el objetivo', () => {
    expect(weeklyPace(0, MONDAY)).toBeNull()
    expect(weeklyPace(-30, MONDAY)).toBeNull()
  })
})
