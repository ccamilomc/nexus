import { describe, expect, it } from 'vitest'

import type { Routine, RoutineDay, RoutineExerciseWithExercise } from '../types/workout.types'
import { buildRoutineDaySnapshots } from './routine-snapshots'

const AHORA = '2026-08-15T12:00:00.000Z'

function routine(id: string, name: string): Routine {
  return {
    id,
    user_id: 'u1',
    name,
    goal: null,
    days_per_week: 3,
    is_active: true,
    created_at: AHORA,
    updated_at: AHORA,
    deleted_at: null,
  }
}

function day(id: string, routineId: string, name: string, orderIndex = 0): RoutineDay {
  return {
    id,
    routine_id: routineId,
    name,
    order_index: orderIndex,
    created_at: AHORA,
    updated_at: AHORA,
  }
}

function exercise(
  dayId: string,
  name: string,
  orderIndex: number,
  targetSets: number | null = 4,
): RoutineExerciseWithExercise {
  return {
    id: `${dayId}-${name}`,
    routine_day_id: dayId,
    exercise_id: name,
    order_index: orderIndex,
    target_sets: targetSets,
    target_reps: 10,
    target_weight: null,
    rest_seconds: null,
    notes: null,
    created_at: AHORA,
    updated_at: AHORA,
    exercise: { id: name, name, muscle_group: 'chest', equipment: 'barbell' },
  }
}

describe('buildRoutineDaySnapshots', () => {
  it('lleva al motor el nombre de la rutina, el del día y sus ejercicios', () => {
    const snapshots = buildRoutineDaySnapshots(
      [routine('r1', 'Fuerza 3 días')],
      [day('d1', 'r1', 'Empuje')],
      [exercise('d1', 'Press banca', 0)],
    )

    expect(snapshots).toEqual([
      {
        id: 'd1',
        routineName: 'Fuerza 3 días',
        dayName: 'Empuje',
        exercises: [{ name: 'Press banca', sets: 4 }],
      },
    ])
  })

  it('conserva el orden de los ejercicios, que es de lo que depende la versión corta', () => {
    // Si el orden se pierde, la rutina alternativa recorta los básicos y deja
    // los accesorios, que es justo lo contrario de lo que hay que hacer.
    const snapshots = buildRoutineDaySnapshots(
      [routine('r1', 'Fuerza')],
      [day('d1', 'r1', 'Empuje')],
      [
        exercise('d1', 'Elevaciones laterales', 2),
        exercise('d1', 'Press banca', 0),
        exercise('d1', 'Press militar', 1),
      ],
    )

    expect(snapshots[0]?.exercises.map(({ name }) => name)).toEqual([
      'Press banca',
      'Press militar',
      'Elevaciones laterales',
    ])
  })

  it('cuando la rutina no prescribe series, supone tres', () => {
    const snapshots = buildRoutineDaySnapshots(
      [routine('r1', 'Fuerza')],
      [day('d1', 'r1', 'Empuje')],
      [exercise('d1', 'Press banca', 0, null)],
    )

    expect(snapshots[0]?.exercises[0]?.sets).toBe(3)
  })

  it('un día sin ejercicios no se le ofrece al motor', () => {
    // No hay nada que proponer ni nada que cronometrar: sería una opción vacía.
    const snapshots = buildRoutineDaySnapshots(
      [routine('r1', 'Fuerza')],
      [day('d1', 'r1', 'Empuje'), day('d2', 'r1', 'Sin montar', 1)],
      [exercise('d1', 'Press banca', 0)],
    )

    expect(snapshots.map(({ id }) => id)).toEqual(['d1'])
  })

  it('cada día se queda con los ejercicios de su día, no con los del vecino', () => {
    const snapshots = buildRoutineDaySnapshots(
      [routine('r1', 'Fuerza')],
      [day('d1', 'r1', 'Empuje'), day('d2', 'r1', 'Tirón', 1)],
      [exercise('d1', 'Press banca', 0), exercise('d2', 'Dominadas', 0)],
    )

    expect(snapshots.map(({ dayName, exercises }) => [dayName, exercises.length])).toEqual([
      ['Empuje', 1],
      ['Tirón', 1],
    ])
  })

  it('si la rutina del día no está, el día sigue siendo utilizable', () => {
    // El motor elige por ejercicios; quedarse sin nombre de rutina es peor
    // etiqueta, no un motivo para esconder el día.
    const snapshots = buildRoutineDaySnapshots(
      [],
      [day('d1', 'r1', 'Empuje')],
      [exercise('d1', 'Press banca', 0)],
    )

    expect(snapshots[0]?.routineName).toBe('')
    expect(snapshots[0]?.exercises).toHaveLength(1)
  })
})
