import { describe, expect, it } from 'vitest'

import type { Routine, RoutineDay, RoutineExerciseWithExercise } from '../types/workout.types'
import { buildRoutineDetail } from './routine-detail'

const routine = { id: 'r1', name: 'Fuerza' } as Routine

function makeDay(id: string, orderIndex: number): RoutineDay {
  return {
    id,
    routine_id: 'r1',
    name: `Día ${orderIndex}`,
    order_index: orderIndex,
    created_at: '2026-07-24T10:00:00.000Z',
    updated_at: '2026-07-24T10:00:00.000Z',
  }
}

function makeExercise(id: string, dayId: string, name: string): RoutineExerciseWithExercise {
  return {
    id,
    routine_day_id: dayId,
    exercise_id: `ex-${id}`,
    order_index: 0,
    target_sets: null,
    target_reps: null,
    target_weight: null,
    rest_seconds: null,
    notes: null,
    created_at: '2026-07-24T10:00:00.000Z',
    updated_at: '2026-07-24T10:00:00.000Z',
    exercise: { id: `ex-${id}`, name, muscle_group: 'chest', equipment: 'barbell' },
  }
}

describe('buildRoutineDetail', () => {
  it('coloca cada ejercicio bajo su día', () => {
    const detail = buildRoutineDetail(
      routine,
      [makeDay('d1', 0), makeDay('d2', 1)],
      [
        makeExercise('e1', 'd1', 'Press'),
        makeExercise('e2', 'd2', 'Remo'),
        makeExercise('e3', 'd1', 'Aperturas'),
      ],
    )

    expect(detail.days).toHaveLength(2)
    expect(detail.days[0]?.exercises.map((e) => e.exercise.name)).toEqual(['Press', 'Aperturas'])
    expect(detail.days[1]?.exercises.map((e) => e.exercise.name)).toEqual(['Remo'])
  })

  it('conserva el orden de los días recibido', () => {
    const detail = buildRoutineDetail(routine, [makeDay('d1', 0), makeDay('d2', 1)], [])

    expect(detail.days.map((d) => d.day.id)).toEqual(['d1', 'd2'])
  })

  it('deja los días sin ejercicios con lista vacía', () => {
    const detail = buildRoutineDetail(routine, [makeDay('d1', 0)], [])

    expect(detail.days[0]?.exercises).toEqual([])
  })
})
