import { describe, expect, it } from 'vitest'

import type { WorkoutSetWithExercise } from '../types/workout.types'
import { calculateSessionStats, groupSetsByExercise } from './session-stats'

const PRESS: WorkoutSetWithExercise['exercise'] = {
  id: 'ex-press',
  name: 'Press de banca',
  muscle_group: 'chest',
  equipment: 'barbell',
}

const ROW: WorkoutSetWithExercise['exercise'] = {
  id: 'ex-row',
  name: 'Remo con barra',
  muscle_group: 'back',
  equipment: 'barbell',
}

function makeSet(
  exercise: WorkoutSetWithExercise['exercise'],
  overrides: Partial<WorkoutSetWithExercise> = {},
): WorkoutSetWithExercise {
  return {
    id: `set-${Math.random()}`,
    session_id: 'session-1',
    exercise_id: exercise.id,
    set_number: 1,
    reps: 10,
    weight: 50,
    rpe: null,
    is_warmup: false,
    completed: true,
    created_at: '2026-07-24T10:00:00.000Z',
    updated_at: '2026-07-24T10:00:00.000Z',
    deleted_at: null,
    exercise,
    ...overrides,
  }
}

describe('groupSetsByExercise', () => {
  it('agrupa las series por ejercicio conservando el orden de aparición', () => {
    const groups = groupSetsByExercise([
      makeSet(PRESS, { set_number: 1 }),
      makeSet(ROW, { set_number: 1 }),
      makeSet(PRESS, { set_number: 2 }),
    ])

    expect(groups.map((group) => group.exercise.id)).toEqual(['ex-press', 'ex-row'])
    expect(groups[0]?.sets).toHaveLength(2)
    expect(groups[1]?.sets).toHaveLength(1)
  })

  it('no expone el ejercicio dentro de cada serie', () => {
    const [group] = groupSetsByExercise([makeSet(PRESS)])

    expect(group?.sets[0]).not.toHaveProperty('exercise')
  })

  it('devuelve una lista vacía cuando no hay series', () => {
    expect(groupSetsByExercise([])).toEqual([])
  })
})

describe('calculateSessionStats', () => {
  const session = { started_at: '2026-07-24T10:00:00.000Z', ended_at: '2026-07-24T11:05:00.000Z' }

  it('cuenta ejercicios y series, y suma el volumen (reps × peso)', () => {
    const exercises = groupSetsByExercise([
      makeSet(PRESS, { reps: 10, weight: 60 }),
      makeSet(PRESS, { reps: 8, weight: 70 }),
      makeSet(ROW, { reps: 12, weight: 40 }),
    ])

    const stats = calculateSessionStats(session, exercises)

    expect(stats.exerciseCount).toBe(2)
    expect(stats.setCount).toBe(3)
    expect(stats.totalVolumeKg).toBe(10 * 60 + 8 * 70 + 12 * 40)
  })

  it('excluye del volumen el calentamiento y las series no completadas', () => {
    const exercises = groupSetsByExercise([
      makeSet(PRESS, { reps: 10, weight: 20, is_warmup: true }),
      makeSet(PRESS, { reps: 10, weight: 60, completed: false }),
      makeSet(PRESS, { reps: 10, weight: 60 }),
    ])

    const stats = calculateSessionStats(session, exercises)

    expect(stats.setCount).toBe(3)
    expect(stats.totalVolumeKg).toBe(600)
  })

  it('trata como cero las series sin repeticiones o sin peso', () => {
    const exercises = groupSetsByExercise([
      makeSet(PRESS, { reps: null, weight: 60 }),
      makeSet(PRESS, { reps: 10, weight: null }),
    ])

    expect(calculateSessionStats(session, exercises).totalVolumeKg).toBe(0)
  })

  it('calcula la duración en minutos cuando la sesión terminó', () => {
    expect(calculateSessionStats(session, []).durationMinutes).toBe(65)
  })

  it('deja la duración en null mientras la sesión sigue en curso', () => {
    const active = { started_at: '2026-07-24T10:00:00.000Z', ended_at: null }

    expect(calculateSessionStats(active, []).durationMinutes).toBeNull()
  })
})
