import { describe, expect, it } from 'vitest'

import type { Habit } from '../types/habits.types'
import { appliesOn, weekdayOf } from './applies-on'

/** Lunes 24 de agosto de 2026. */
const LUNES = new Date(2026, 7, 24)
const MARTES = new Date(2026, 7, 25)
const MIERCOLES = new Date(2026, 7, 26)
const DOMINGO = new Date(2026, 7, 30)

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    user_id: 'u1',
    name: 'Gimnasio',
    description: null,
    icon: 'check',
    color: '#2563eb',
    frequency: 'daily',
    target_count: 1,
    target_weekdays: null,
    is_active: true,
    archived_at: null,
    created_at: new Date(2026, 0, 1).toISOString(),
    updated_at: new Date(2026, 0, 1).toISOString(),
    deleted_at: null,
    ...overrides,
  }
}

describe('weekdayOf', () => {
  it('cuenta el lunes como 1 y el domingo como 7', () => {
    // `Date.getDay()` pone el domingo en 0; la base usa ISO, como
    // `week_starts_on`. La traducción vive aquí y en ningún otro sitio.
    expect(weekdayOf(LUNES)).toBe(1)
    expect(weekdayOf(DOMINGO)).toBe(7)
  })
})

describe('appliesOn', () => {
  it('sin días marcados, el hábito es diario', () => {
    // Es como se comportaban todos antes de que existieran los días.
    expect(appliesOn(habit(), LUNES)).toBe(true)
    expect(appliesOn(habit(), DOMINGO)).toBe(true)
  })

  it('una lista vacía también es diario, no «ningún día»', () => {
    // Guardar `{}` sin querer no puede dejar un hábito que no toca nunca.
    expect(appliesOn(habit({ target_weekdays: [] }), MARTES)).toBe(true)
  })

  it('con días marcados sólo cuentan ésos', () => {
    const gimnasio = habit({ target_weekdays: [1, 3, 5] })

    expect(appliesOn(gimnasio, LUNES)).toBe(true)
    expect(appliesOn(gimnasio, MIERCOLES)).toBe(true)
    expect(appliesOn(gimnasio, MARTES)).toBe(false)
  })

  it('no cuenta antes de que el hábito existiera', () => {
    // Un hábito creado el miércoles no falló el lunes anterior.
    const nuevo = habit({ created_at: MIERCOLES.toISOString() })

    expect(appliesOn(nuevo, LUNES)).toBe(false)
    expect(appliesOn(nuevo, MIERCOLES)).toBe(true)
  })

  it('el día en que se creó sí cuenta', () => {
    expect(appliesOn(habit({ created_at: LUNES.toISOString() }), LUNES)).toBe(true)
  })

  it('las dos condiciones se cumplen a la vez, no una u otra', () => {
    // Creado el miércoles y sólo los lunes: el lunes anterior no cuenta.
    const raro = habit({ created_at: MIERCOLES.toISOString(), target_weekdays: [1] })

    expect(appliesOn(raro, LUNES)).toBe(false)
  })
})
