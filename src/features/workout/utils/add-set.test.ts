import { describe, expect, it } from 'vitest'

import type {
  ExerciseRef,
  LogSetInput,
  SessionDetail,
  SessionExercise,
  WorkoutSet,
} from '../types/workout.types'
import { addSetToSession, findExerciseRef, nextSetNumber } from './add-set'

const BENCH: ExerciseRef = {
  id: 'e1',
  name: 'Press banca',
  muscle_group: 'chest',
  equipment: 'barbell',
}
const ROW: ExerciseRef = { id: 'e2', name: 'Remo', muscle_group: 'back', equipment: 'barbell' }

function set(id: string, setNumber: number, exerciseId = BENCH.id): WorkoutSet {
  return {
    id,
    session_id: 's1',
    exercise_id: exerciseId,
    set_number: setNumber,
    reps: 10,
    weight: 50,
    is_warmup: false,
    completed: true,
    rpe: null,
    deleted_at: null,
    created_at: '2026-08-15T10:00:00.000Z',
    updated_at: '2026-08-15T10:00:00.000Z',
  }
}

function session(exercises: readonly SessionExercise[]): SessionDetail {
  return {
    session: {
      id: 's1',
      user_id: 'u1',
      started_at: '2026-08-15T09:00:00.000Z',
      ended_at: null,
      status: 'in_progress',
      routine_day_id: null,
      notes: null,
      perceived_effort: null,
      created_at: '2026-08-15T09:00:00.000Z',
      updated_at: '2026-08-15T09:00:00.000Z',
      deleted_at: null,
    },
    exercises,
    stats: { exerciseCount: 0, setCount: 0, totalVolumeKg: 0, durationMinutes: null },
    plan: null,
  }
}

/** La misma sesión, pero originada por un día de rutina con ese ejercicio. */
function withPlan(detail: SessionDetail, exercise: ExerciseRef): SessionDetail {
  return {
    ...detail,
    plan: {
      day: {
        id: 'd1',
        routine_id: 'r1',
        name: 'Tirón',
        order_index: 1,
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-08-01T00:00:00.000Z',
      },
      exercises: [
        {
          id: 're1',
          routine_day_id: 'd1',
          exercise_id: exercise.id,
          order_index: 1,
          target_sets: 4,
          target_reps: 6,
          target_weight: null,
          rest_seconds: null,
          notes: null,
          created_at: '2026-08-01T00:00:00.000Z',
          updated_at: '2026-08-01T00:00:00.000Z',
          exercise,
        },
      ],
    },
  }
}

const input: LogSetInput = {
  id: 'nueva',
  userId: 'u1',
  sessionId: 's1',
  exerciseId: BENCH.id,
  reps: 8,
  weightKg: 60,
  setNumber: 2,
  loggedAt: '2026-08-15T10:05:00.000Z',
}

describe('nextSetNumber', () => {
  it('la primera serie de un ejercicio es la número uno', () => {
    expect(nextSetNumber(session([]), BENCH.id)).toBe(1)
  })

  it('sigue a la última apuntada de ese ejercicio', () => {
    const actual = session([{ exercise: BENCH, sets: [set('a', 1), set('b', 2)] }])

    expect(nextSetNumber(actual, BENCH.id)).toBe(3)
  })

  it('cuenta sólo las de su ejercicio, no las de la sesión entera', () => {
    const actual = session([
      { exercise: BENCH, sets: [set('a', 1), set('b', 2), set('c', 3)] },
      { exercise: ROW, sets: [set('d', 1, ROW.id)] },
    ])

    expect(nextSetNumber(actual, ROW.id)).toBe(2)
  })

  it('sin sesión cargada empieza por uno en vez de reventar', () => {
    expect(nextSetNumber(null, BENCH.id)).toBe(1)
  })

  it('mira el número más alto, no cuántas hay: con una serie borrada no repite', () => {
    // Quitar la serie 2 de tres dejaba la siguiente en 3, que ya existía.
    const actual = session([{ exercise: BENCH, sets: [set('a', 1), set('c', 3)] }])

    expect(nextSetNumber(actual, BENCH.id)).toBe(4)
  })
})

describe('findExerciseRef', () => {
  it('lo saca de las series ya apuntadas', () => {
    const actual = session([{ exercise: BENCH, sets: [set('a', 1)] }])

    expect(findExerciseRef(actual, undefined, BENCH.id)).toEqual(BENCH)
  })

  it('lo saca del plan del día en su primera serie, sin catálogo cargado', () => {
    // El fallo que se coló: al entrenar con rutina el catálogo no está cargado,
    // así que la primera serie de cada ejercicio no se pintaba y las siguientes
    // salían numeradas 1 una y otra vez.
    const actual = withPlan(session([]), BENCH)

    expect(findExerciseRef(actual, undefined, BENCH.id)).toEqual(BENCH)
  })

  it('lo saca del catálogo para lo que se añade fuera de la rutina', () => {
    expect(findExerciseRef(session([]), [ROW], ROW.id)).toEqual(ROW)
  })

  it('devuelve null si no aparece en ningún sitio, en vez de inventar un nombre', () => {
    expect(findExerciseRef(session([]), [ROW], 'desconocido')).toBeNull()
  })
})

describe('addSetToSession', () => {
  it('añade la serie a su ejercicio', () => {
    const actual = addSetToSession(
      session([{ exercise: BENCH, sets: [set('a', 1)] }]),
      input,
      BENCH,
    )

    expect(actual.exercises[0]?.sets.map(({ id }) => id)).toEqual(['a', 'nueva'])
  })

  it('abre el ejercicio si es su primera serie, y lo pone al final', () => {
    const actual = addSetToSession(
      session([{ exercise: ROW, sets: [set('d', 1, ROW.id)] }]),
      input,
      BENCH,
    )

    expect(actual.exercises.map(({ exercise }) => exercise.id)).toEqual([ROW.id, BENCH.id])
  })

  it('recalcula las cifras para que la pantalla no discrepe de sí misma', () => {
    const actual = addSetToSession(
      session([{ exercise: BENCH, sets: [set('a', 1)] }]),
      input,
      BENCH,
    )

    expect(actual.stats).toMatchObject({
      exerciseCount: 1,
      setCount: 2,
      // 10 × 50 de la que había, más 8 × 60 de la nueva.
      totalVolumeKg: 980,
    })
  })

  it('no toca la sesión original', () => {
    const original = session([{ exercise: BENCH, sets: [set('a', 1)] }])

    addSetToSession(original, input, BENCH)

    expect(original.exercises[0]?.sets).toHaveLength(1)
  })
})
