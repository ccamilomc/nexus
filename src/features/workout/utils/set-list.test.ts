import { describe, expect, it } from 'vitest'

import type { WorkoutSet } from '../types/workout.types'
import { describeSets } from './set-list'

function serie(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: crypto.randomUUID(),
    session_id: 's1',
    exercise_id: 'e1',
    set_number: 1,
    reps: 10,
    weight: 60,
    is_warmup: false,
    completed: true,
    rpe: null,
    deleted_at: null,
    created_at: '2026-08-27T10:00:00.000Z',
    updated_at: '2026-08-27T10:00:00.000Z',
    ...overrides,
  }
}

describe('describeSets', () => {
  it('numera las series de trabajo en orden', () => {
    const descritas = describeSets([serie(), serie(), serie()])

    expect(descritas.map((d) => d.label)).toEqual(['Serie 1', 'Serie 2', 'Serie 3'])
  })

  it('los calentamientos no gastan número', () => {
    // Es la razón de ser de este archivo: con tres calentamientos delante, la
    // primera de verdad tiene que ser la 1 y no la 4, porque el volumen y el
    // progreso tampoco cuentan las de calentamiento.
    const descritas = describeSets([
      serie({ is_warmup: true }),
      serie({ is_warmup: true }),
      serie(),
      serie(),
    ])

    expect(descritas.map((d) => d.label)).toEqual([
      'Calentamiento',
      'Calentamiento',
      'Serie 1',
      'Serie 2',
    ])
  })

  it('un calentamiento en medio no rompe la cuenta', () => {
    const descritas = describeSets([serie(), serie({ is_warmup: true }), serie()])

    expect(descritas.map((d) => d.label)).toEqual(['Serie 1', 'Calentamiento', 'Serie 2'])
  })

  it('enseña el esfuerzo de la serie cuando se anotó', () => {
    const descritas = describeSets([serie({ rpe: 8 }), serie({ rpe: 10 }), serie()])

    expect(descritas.map((d) => d.effort)).toEqual(['quedaban 2', 'al fallo', null])
  })

  it('no enseña esfuerzo en un calentamiento aunque lo traiga', () => {
    const descritas = describeSets([serie({ is_warmup: true, rpe: 9 })])

    expect(descritas[0]?.effort).toBeNull()
  })

  it('una lista vacía no revienta', () => {
    expect(describeSets([])).toEqual([])
  })
})
