import { describe, expect, it } from 'vitest'

import type { SessionExercise, WorkoutSet } from '../types/workout.types'
import { findLastSetAt } from './last-set-at'

function serie(createdAt: string): WorkoutSet {
  return {
    id: createdAt,
    session_id: 's1',
    exercise_id: 'e1',
    set_number: 1,
    reps: 8,
    weight: 50,
    rpe: null,
    is_warmup: false,
    completed: true,
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
  }
}

function ejercicio(id: string, sets: WorkoutSet[]): SessionExercise {
  return {
    exercise: { id, name: id, muscle_group: 'chest', equipment: 'barbell' },
    sets,
  }
}

describe('findLastSetAt', () => {
  it('coge la más reciente de toda la sesión, no la del último ejercicio', () => {
    // El descanso no se reinicia por cambiar de banca a dominadas: corre igual.
    const exercises = [
      ejercicio('press', [serie('2026-08-14T10:05:00.000Z')]),
      ejercicio('dominadas', [serie('2026-08-14T10:02:00.000Z')]),
    ]

    expect(findLastSetAt(exercises)).toBe('2026-08-14T10:05:00.000Z')
  })

  it('dentro de un ejercicio coge la última', () => {
    const exercises = [
      ejercicio('press', [serie('2026-08-14T10:00:00.000Z'), serie('2026-08-14T10:04:00.000Z')]),
    ]

    expect(findLastSetAt(exercises)).toBe('2026-08-14T10:04:00.000Z')
  })

  it('sin series todavía no hay descanso que contar', () => {
    expect(findLastSetAt([ejercicio('press', [])])).toBeNull()
    expect(findLastSetAt([])).toBeNull()
  })
})
