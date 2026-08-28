import { describe, expect, it } from 'vitest'

import type { WorkoutSetWithExercise } from '../types/workout.types'
import { calculateSessionStats, groupSetsByExercise, hasAnySet } from './session-stats'

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

  it('ordena las series por su número, no por cuándo llegaron', () => {
    // Las que esperaron sin red salen casi a la vez al recuperarla, así que su
    // `created_at` puede quedar en cualquier orden: tres series apuntadas 10, 9
    // y 8 aparecían al revés.
    const groups = groupSetsByExercise([
      makeSet(PRESS, { set_number: 3, reps: 8, created_at: '2026-07-24T10:00:00.000Z' }),
      makeSet(PRESS, { set_number: 1, reps: 10, created_at: '2026-07-24T10:00:00.100Z' }),
      makeSet(PRESS, { set_number: 2, reps: 9, created_at: '2026-07-24T10:00:00.200Z' }),
    ])

    expect(groups[0]?.sets.map((set) => set.reps)).toEqual([10, 9, 8])
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

  it('el calentamiento y lo no completado no cuentan, ni en volumen ni en series', () => {
    const exercises = groupSetsByExercise([
      makeSet(PRESS, { reps: 10, weight: 20, is_warmup: true }),
      makeSet(PRESS, { reps: 10, weight: 60, completed: false }),
      makeSet(PRESS, { reps: 10, weight: 60 }),
    ])

    const stats = calculateSessionStats(session, exercises)

    // `setCount` contaba las tres y el volumen sólo una: la misma tarjeta podía
    // decir «Series 3» encima de una lista con una. Las dos cifras salen ahora
    // de la misma definición.
    expect(stats.setCount).toBe(1)
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

describe('hasAnySet', () => {
  const session = { started_at: '2026-07-24T10:00:00.000Z', ended_at: null }

  it('sin ejercicios no hay nada apuntado', () => {
    expect(hasAnySet([])).toBe(false)
  })

  it('un ejercicio abierto pero todavía sin series no cuenta', () => {
    expect(hasAnySet([{ exercise: PRESS, sets: [] }])).toBe(false)
  })

  it('sólo calentamientos ya es algo apuntado', () => {
    // Es la razón de existir de esta función: `setCount` vale cero aquí, y aun
    // así el entrenamiento tiene que poder cerrarse. Con la comprobación
    // antigua (`setCount > 0`) quien sólo llegó a calentar se quedaba encerrado.
    const exercises = groupSetsByExercise([makeSet(PRESS, { is_warmup: true })])

    expect(calculateSessionStats(session, exercises).setCount).toBe(0)
    expect(hasAnySet(exercises)).toBe(true)
  })

  it('basta con que uno de los ejercicios tenga series', () => {
    const exercises = groupSetsByExercise([makeSet(ROW)])

    expect(hasAnySet([{ exercise: PRESS, sets: [] }, ...exercises])).toBe(true)
  })
})
