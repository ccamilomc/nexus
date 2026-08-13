import { describe, expect, it } from 'vitest'

import type { SessionSample, WorkoutSetWithExercise } from '../types/workout.types'
import { buildLastPerformances } from './last-performance'

/** Sesiones de la más reciente a la más antigua, que es como llegan. */
function session(id: string, day: number): SessionSample {
  return {
    id,
    started_at: `2026-08-${String(day).padStart(2, '0')}T18:00:00.000Z`,
    ended_at: `2026-08-${String(day).padStart(2, '0')}T19:00:00.000Z`,
  }
}

interface SetOptions {
  readonly warmup?: boolean
}

function set(
  sessionId: string,
  exerciseId: string,
  reps: number,
  weight: number,
  { warmup = false }: SetOptions = {},
): WorkoutSetWithExercise {
  return {
    id: `${sessionId}-${exerciseId}-${reps}-${weight}-${warmup ? 'w' : 'x'}`,
    session_id: sessionId,
    exercise_id: exerciseId,
    reps,
    weight,
    is_warmup: warmup,
    completed: true,
    set_number: 1,
    rpe: null,
    created_at: '',
    updated_at: '',
    deleted_at: null,
    exercise: { id: exerciseId, name: exerciseId, muscle_group: 'chest', equipment: 'barbell' },
  }
}

describe('buildLastPerformances', () => {
  it('coge la última sesión en la que salió ese ejercicio, no la última a secas', () => {
    // El caso de una rutina por días: el press no se toca desde hace tres
    // entrenamientos y sigue siendo lo último que se hizo.
    const sessions = [session('s3', 12), session('s2', 10), session('s1', 5)]
    const sets = [set('s3', 'sentadilla', 5, 100), set('s1', 'press', 8, 70)]

    const [press] = buildLastPerformances(sessions, sets).filter(
      ({ exerciseId }) => exerciseId === 'press',
    )

    expect(press?.performedAt).toContain('2026-08-05')
    expect(press?.topSet).toEqual({ reps: 8, weightKg: 70 })
  })

  it('el calentamiento no cuenta como referencia', () => {
    // Una barra vacía entre las series daría un peso que no dice nada.
    const sessions = [session('s1', 5)]
    const sets = [
      set('s1', 'press', 12, 20, { warmup: true }),
      set('s1', 'press', 8, 70),
      set('s1', 'press', 7, 70),
    ]

    const [press] = buildLastPerformances(sessions, sets)

    expect(press?.sets).toHaveLength(2)
    expect(press?.topSet).toEqual({ reps: 8, weightKg: 70 })
  })

  it('la serie de referencia es la más pesada, no la última', () => {
    const sessions = [session('s1', 5)]
    const sets = [set('s1', 'press', 8, 70), set('s1', 'press', 5, 80), set('s1', 'press', 6, 60)]

    const [press] = buildLastPerformances(sessions, sets)

    expect(press?.topSet).toEqual({ reps: 5, weightKg: 80 })
  })

  it('a igual peso, gana la de más repeticiones', () => {
    // Con el mismo peso, lo que se mejoró ese día fueron las repeticiones.
    const sessions = [session('s1', 5)]
    const sets = [set('s1', 'press', 8, 70), set('s1', 'press', 10, 70)]

    const [press] = buildLastPerformances(sessions, sets)

    expect(press?.topSet).toEqual({ reps: 10, weightKg: 70 })
  })

  it('un ejercicio de sólo calentamiento no deja referencia', () => {
    const sessions = [session('s1', 5)]
    const sets = [set('s1', 'press', 12, 20, { warmup: true })]

    expect(buildLastPerformances(sessions, sets)).toEqual([])
  })

  it('sin sesiones no devuelve nada', () => {
    expect(buildLastPerformances([], [])).toEqual([])
  })

  it('ignora series de sesiones que no se trajeron', () => {
    // El tramo está acotado: una serie de más atrás no debe colarse como si
    // fuera de la última sesión conocida.
    const sessions = [session('s1', 5)]
    const sets = [set('s9', 'press', 8, 70)]

    expect(buildLastPerformances(sessions, sets)).toEqual([])
  })
})
