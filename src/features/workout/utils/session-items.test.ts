import { describe, expect, it } from 'vitest'

import type {
  Exercise,
  ExerciseRef,
  RoutineDayDetail,
  RoutineExerciseWithExercise,
  SessionExercise,
  WorkoutSet,
} from '../types/workout.types'
import { buildSessionItems } from './session-items'

function ref(id: string, name: string): ExerciseRef {
  return { id, name, muscle_group: 'chest', equipment: 'barbell' }
}

function logged(id: string, name: string): SessionExercise {
  return { exercise: ref(id, name), sets: [{ id: `set-${id}` } as WorkoutSet] }
}

function prescribed(id: string, name: string, targetSets: number): RoutineExerciseWithExercise {
  return {
    id: `re-${id}`,
    routine_day_id: 'day-1',
    exercise_id: id,
    order_index: 0,
    target_sets: targetSets,
    target_reps: 10,
    target_weight: null,
    rest_seconds: null,
    notes: null,
    created_at: '2026-07-24T10:00:00.000Z',
    updated_at: '2026-07-24T10:00:00.000Z',
    exercise: ref(id, name),
  }
}

function plan(exercises: readonly RoutineExerciseWithExercise[]): RoutineDayDetail {
  return {
    day: {
      id: 'day-1',
      routine_id: 'r1',
      name: 'Empuje',
      order_index: 0,
      created_at: '2026-07-24T10:00:00.000Z',
      updated_at: '2026-07-24T10:00:00.000Z',
    },
    exercises,
  }
}

const draft = (id: string, name: string) => ({ ...ref(id, name) }) as Exercise

describe('buildSessionItems', () => {
  it('sin rutina, muestra lo registrado y luego los añadidos a mano', () => {
    const items = buildSessionItems([logged('a', 'Press')], null, [draft('b', 'Remo')])

    expect(items.map((item) => item.exercise.id)).toEqual(['a', 'b'])
    expect(items[0]?.canRemove).toBe(false)
    expect(items[1]?.canRemove).toBe(true)
  })

  it('precarga los ejercicios prescritos que aún no se han registrado', () => {
    const items = buildSessionItems([], plan([prescribed('a', 'Press', 4)]), [])

    expect(items).toHaveLength(1)
    expect(items[0]?.sets).toEqual([])
    expect(items[0]?.prescribed?.target_sets).toBe(4)
  })

  it('no duplica un prescrito que ya tiene series, y conserva su objetivo', () => {
    const items = buildSessionItems(
      [logged('a', 'Press')],
      plan([prescribed('a', 'Press', 4), prescribed('b', 'Fondos', 3)]),
      [],
    )

    expect(items.map((item) => item.exercise.id)).toEqual(['a', 'b'])
    expect(items[0]?.sets).toHaveLength(1)
    expect(items[0]?.prescribed?.target_sets).toBe(4)
  })

  it('ordena: registrados, luego prescritos pendientes, luego añadidos a mano', () => {
    const items = buildSessionItems([logged('c', 'Curl')], plan([prescribed('a', 'Press', 4)]), [
      draft('z', 'Extra'),
    ])

    expect(items.map((item) => item.exercise.id)).toEqual(['c', 'a', 'z'])
  })

  it('los prescritos nunca se pueden quitar: son el plan', () => {
    const items = buildSessionItems([], plan([prescribed('a', 'Press', 4)]), [])

    expect(items[0]?.canRemove).toBe(false)
  })

  it('ignora un añadido a mano que ya está prescrito o registrado', () => {
    const items = buildSessionItems([logged('a', 'Press')], plan([prescribed('b', 'Fondos', 3)]), [
      draft('a', 'Press'),
      draft('b', 'Fondos'),
    ])

    expect(items.map((item) => item.exercise.id)).toEqual(['a', 'b'])
  })
})
