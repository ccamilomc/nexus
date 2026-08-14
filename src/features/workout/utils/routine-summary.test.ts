import { describe, expect, it } from 'vitest'

import type {
  Routine,
  RoutineDay,
  RoutineDayUsage,
  RoutineExerciseWithExercise,
} from '../types/workout.types'
import { buildRoutineSummaries } from './routine-summary'

function rutina(id: string, name: string): Routine {
  return {
    id,
    user_id: 'quien-sea',
    name,
    goal: null,
    days_per_week: null,
    is_active: true,
    created_at: '',
    updated_at: '',
    deleted_at: null,
  }
}

function dia(id: string, routineId: string, orderIndex: number): RoutineDay {
  return {
    id,
    routine_id: routineId,
    name: id,
    order_index: orderIndex,
    created_at: '',
    updated_at: '',
  }
}

function prescrito(dayId: string, exerciseId: string): RoutineExerciseWithExercise {
  return {
    id: `${dayId}-${exerciseId}`,
    routine_day_id: dayId,
    exercise_id: exerciseId,
    order_index: 0,
    target_sets: null,
    target_reps: null,
    target_weight: null,
    rest_seconds: null,
    notes: null,
    created_at: '',
    updated_at: '',
    exercise: { id: exerciseId, name: exerciseId, muscle_group: 'chest', equipment: 'barbell' },
  }
}

function uso(dayId: string, day: number): RoutineDayUsage {
  const fecha = `2026-08-${String(day).padStart(2, '0')}T19:00:00.000Z`
  return { routine_day_id: dayId, started_at: fecha, ended_at: fecha }
}

describe('buildRoutineSummaries', () => {
  it('cuenta los días de cada rutina y los ejercicios de todos ellos', () => {
    const resumen = buildRoutineSummaries(
      [rutina('r1', 'Push Pull Legs')],
      [dia('d1', 'r1', 0), dia('d2', 'r1', 1)],
      [prescrito('d1', 'press'), prescrito('d1', 'aperturas'), prescrito('d2', 'remo')],
      [],
    )

    expect(resumen[0]?.dayCount).toBe(2)
    expect(resumen[0]?.exerciseCount).toBe(3)
  })

  it('un ejercicio que sale en dos días cuenta dos veces', () => {
    // Son dos cosas que hacer en la semana, no una.
    const resumen = buildRoutineSummaries(
      [rutina('r1', 'Rutina')],
      [dia('d1', 'r1', 0), dia('d2', 'r1', 1)],
      [prescrito('d1', 'press'), prescrito('d2', 'press')],
      [],
    )

    expect(resumen[0]?.exerciseCount).toBe(2)
  })

  it('la rutina se usó cuando se usó cualquiera de sus días, y vale el más reciente', () => {
    const resumen = buildRoutineSummaries(
      [rutina('r1', 'Rutina')],
      [dia('d1', 'r1', 0), dia('d2', 'r1', 1)],
      [],
      [uso('d2', 12), uso('d1', 5)],
    )

    expect(resumen[0]?.lastUsedAt).toContain('2026-08-12')
  })

  it('no mezcla los días ni el uso de otra rutina', () => {
    const resumen = buildRoutineSummaries(
      [rutina('r1', 'Mía'), rutina('r2', 'Otra')],
      [dia('d1', 'r1', 0), dia('d2', 'r2', 0)],
      [prescrito('d1', 'press'), prescrito('d2', 'sentadilla')],
      [uso('d2', 12)],
    )

    expect(resumen[0]).toMatchObject({ dayCount: 1, exerciseCount: 1, lastUsedAt: null })
    expect(resumen[1]?.lastUsedAt).toContain('2026-08-12')
  })

  it('una rutina recién creada se distingue de una abandonada', () => {
    // Sin usar es `null`, no una fecha inventada: la pantalla dice «todavía sin
    // usar» en vez de callarse.
    const resumen = buildRoutineSummaries([rutina('r1', 'Nueva')], [], [], [])

    expect(resumen[0]).toMatchObject({ dayCount: 0, exerciseCount: 0, lastUsedAt: null })
  })
})
