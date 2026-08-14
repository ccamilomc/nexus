import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAppError } from '@/core/error'

import { workoutRepository } from '../repositories/workout.repository'
import type {
  Exercise,
  ExerciseRef,
  RoutineDay,
  RoutineExerciseWithExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSetWithExercise,
} from '../types/workout.types'
import { workoutService } from './workout.service'

/**
 * El repositorio se sustituye por completo: estos tests comprueban **reglas de
 * negocio**, no consultas. Con la factoría, el módulo real ni siquiera se carga,
 * así que no arrastra el cliente de Supabase (ni sus variables de entorno).
 */
vi.mock('../repositories/workout.repository', () => ({
  workoutRepository: {
    listExercises: vi.fn(),
    insertExercise: vi.fn(),
    updateExercise: vi.fn(),
    deleteExercise: vi.fn(),
    findActiveSession: vi.fn(),
    insertSession: vi.fn(),
    updateSession: vi.fn(),
    listCompletedSessions: vi.fn(),
    listSetsBySessions: vi.fn(),
    findLastSetNumber: vi.fn(),
    insertSet: vi.fn(),
    softDeleteSet: vi.fn(),
    findRoutineDay: vi.fn(),
    listExercisesByDays: vi.fn(),
    listRoutines: vi.fn(),
    findRoutine: vi.fn(),
    insertRoutine: vi.fn(),
    updateRoutine: vi.fn(),
    listDays: vi.fn(),
    insertRoutineDay: vi.fn(),
    insertRoutineExercise: vi.fn(),
    deleteRoutineDay: vi.fn(),
    deleteRoutineExercise: vi.fn(),
  },
}))

const findActiveSession = vi.mocked(workoutRepository.findActiveSession)
const insertSession = vi.mocked(workoutRepository.insertSession)
const updateSession = vi.mocked(workoutRepository.updateSession)
const listSetsBySessions = vi.mocked(workoutRepository.listSetsBySessions)
const listCompletedSessions = vi.mocked(workoutRepository.listCompletedSessions)
const findRoutineDay = vi.mocked(workoutRepository.findRoutineDay)
const listExercisesByDays = vi.mocked(workoutRepository.listExercisesByDays)
const findLastSetNumber = vi.mocked(workoutRepository.findLastSetNumber)
const insertSet = vi.mocked(workoutRepository.insertSet)
const deleteExercise = vi.mocked(workoutRepository.deleteExercise)
const insertExercise = vi.mocked(workoutRepository.insertExercise)

const USER_ID = 'user-1'
const DAY_ID = 'day-push'

const BENCH: ExerciseRef = {
  id: 'ex-bench',
  name: 'Press de banca',
  muscle_group: 'chest',
  equipment: 'barbell',
}

function session(id: string, routineDayId: string | null = null): WorkoutSession {
  return {
    id,
    user_id: USER_ID,
    routine_day_id: routineDayId,
    status: 'in_progress',
    started_at: '2026-07-29T15:00:00.000Z',
    ended_at: null,
    notes: null,
    perceived_effort: null,
    created_at: '2026-07-29T15:00:00.000Z',
    updated_at: '2026-07-29T15:00:00.000Z',
    deleted_at: null,
  }
}

function set(id: string, sessionId: string, setNumber: number, reps = 10): WorkoutSetWithExercise {
  return {
    id,
    session_id: sessionId,
    exercise_id: BENCH.id,
    set_number: setNumber,
    reps,
    weight: 60,
    rpe: null,
    is_warmup: false,
    completed: true,
    created_at: '2026-07-29T15:10:00.000Z',
    updated_at: '2026-07-29T15:10:00.000Z',
    deleted_at: null,
    exercise: BENCH,
  }
}

const ROUTINE_DAY: RoutineDay = {
  id: DAY_ID,
  routine_id: 'routine-1',
  name: 'Empuje',
  order_index: 0,
  created_at: '2026-07-01T10:00:00.000Z',
  updated_at: '2026-07-01T10:00:00.000Z',
}

const PRESCRIBED: RoutineExerciseWithExercise = {
  id: 'rex-1',
  routine_day_id: DAY_ID,
  exercise_id: BENCH.id,
  order_index: 0,
  target_sets: 4,
  target_reps: 8,
  target_weight: 60,
  rest_seconds: null,
  notes: null,
  created_at: '2026-07-01T10:00:00.000Z',
  updated_at: '2026-07-01T10:00:00.000Z',
  exercise: BENCH,
}

/** Fila devuelta por la base tras guardar; los tests sólo miran lo que envían. */
const SAVED_EXERCISE: Exercise = {
  ...BENCH,
  secondary_muscles: [],
  instructions: null,
  is_custom: true,
  user_id: USER_ID,
  created_at: '2026-07-29T15:00:00.000Z',
  updated_at: '2026-07-29T15:00:00.000Z',
}

const SAVED_SET: WorkoutSet = {
  id: 'set-nueva',
  session_id: 's1',
  exercise_id: BENCH.id,
  set_number: 1,
  reps: 10,
  weight: 60,
  rpe: null,
  is_warmup: false,
  completed: true,
  created_at: '2026-07-29T15:10:00.000Z',
  updated_at: '2026-07-29T15:10:00.000Z',
  deleted_at: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  findActiveSession.mockResolvedValue(null)
  listSetsBySessions.mockResolvedValue([])
  listExercisesByDays.mockResolvedValue([])
  findRoutineDay.mockResolvedValue(ROUTINE_DAY)
  insertSession.mockImplementation(async (_userId, input) => ({
    ...session('nueva', input?.routineDayId ?? null),
    ...(input?.startedAt ? { started_at: input.startedAt } : {}),
    ...(input?.endedAt ? { ended_at: input.endedAt } : {}),
  }))
})

describe('workoutService.startSessionFromRoutineDay', () => {
  it('crea la sesión enlazada al día y precarga sus ejercicios prescritos', async () => {
    listExercisesByDays.mockResolvedValue([PRESCRIBED])

    const detail = await workoutService.startSessionFromRoutineDay(USER_ID, DAY_ID)

    expect(insertSession).toHaveBeenCalledExactlyOnceWith(USER_ID, { routineDayId: DAY_ID })
    expect(detail.session.routine_day_id).toBe(DAY_ID)
    expect(detail.plan?.day).toEqual(ROUTINE_DAY)
    expect(detail.plan?.exercises).toEqual([PRESCRIBED])
  })

  it('devuelve el entrenamiento en curso en lugar de abrir otro', async () => {
    // Doble pulsación o dos dispositivos: nunca se parte el entrenamiento en dos.
    findActiveSession.mockResolvedValue(session('en-curso', DAY_ID))
    listSetsBySessions.mockResolvedValue([set('set-1', 'en-curso', 1)])

    const detail = await workoutService.startSessionFromRoutineDay(USER_ID, DAY_ID)

    expect(insertSession).not.toHaveBeenCalled()
    expect(detail.session.id).toBe('en-curso')
    // Lo ya registrado sigue ahí: no se pisa lo que el usuario está haciendo.
    expect(detail.stats.setCount).toBe(1)
  })

  it('respeta el entrenamiento libre en curso aunque se pida otro desde una rutina', async () => {
    findActiveSession.mockResolvedValue(session('libre'))

    const detail = await workoutService.startSessionFromRoutineDay(USER_ID, DAY_ID)

    expect(insertSession).not.toHaveBeenCalled()
    expect(detail.session.id).toBe('libre')
    expect(detail.plan).toBeNull()
  })
})

describe('workoutService.reopenSession', () => {
  it('lo devuelve a en curso sin tocar su fin', async () => {
    // El fin es lo que guarda la fecha y la duración: ponerlo a cero haría que
    // un entrenamiento de hace tres días apareciera durando tres días.
    await workoutService.reopenSession(USER_ID, 'una-vieja')

    expect(updateSession).toHaveBeenCalledExactlyOnceWith('una-vieja', {
      status: 'in_progress',
    })
  })

  it('no reabre nada si hay otro en curso', async () => {
    findActiveSession.mockResolvedValue(session('en-curso'))

    const error: unknown = await workoutService
      .reopenSession(USER_ID, 'una-vieja')
      .catch((e: unknown) => e)

    expect(isAppError(error)).toBe(true)
    expect(updateSession).not.toHaveBeenCalled()
  })
})

describe('workoutService.removeSession', () => {
  it('sale de la aplicación pero sigue siendo un entrenamiento hecho', async () => {
    // A diferencia de descartar uno en curso, que nunca llegó a contar: esto
    // ocurrió y se borra, así que el estado no se toca.
    await workoutService.removeSession('una-vieja')

    const [, patch] = updateSession.mock.calls[0] ?? []

    expect(patch?.deleted_at).toEqual(expect.any(String))
    expect(patch?.status).toBeUndefined()
  })
})

describe('workoutService.startPastSession', () => {
  const AYER = { date: '2026-08-12', startTime: '07:15', durationMinutes: 75 }

  it('nace con su fin ya puesto, para que la duración sobreviva a una recarga', async () => {
    const detail = await workoutService.startPastSession(USER_ID, AYER)

    const { startedAt, endedAt } = (insertSession.mock.calls[0]?.[1] ?? {}) as {
      startedAt?: string
      endedAt?: string
    }
    const duracion =
      (new Date(endedAt ?? '').getTime() - new Date(startedAt ?? '').getTime()) / 60_000

    expect(duracion).toBe(75)
    expect(detail.session.ended_at).toBe(endedAt)
  })

  it('no pisa un entrenamiento en curso', async () => {
    // Quien está entrenando y se pone a apuntar otro no debería perder el suyo.
    findActiveSession.mockResolvedValue(session('en-curso'))

    const detail = await workoutService.startPastSession(USER_ID, AYER)

    expect(insertSession).not.toHaveBeenCalled()
    expect(detail.session.id).toBe('en-curso')
  })

  it('avisa en vez de inventarse una fecha que no se entiende', async () => {
    const error: unknown = await workoutService
      .startPastSession(USER_ID, { ...AYER, date: '' })
      .catch((e: unknown) => e)

    expect(isAppError(error)).toBe(true)
    expect(insertSession).not.toHaveBeenCalled()
  })

  it('la sesión sigue siendo válida si el día de rutina ya no existe', async () => {
    // El día pudo borrarse después de empezar: se queda sin plan, no falla.
    findRoutineDay.mockResolvedValue(null)

    const detail = await workoutService.startSessionFromRoutineDay(USER_ID, DAY_ID)

    expect(detail.plan).toBeNull()
    expect(listExercisesByDays).not.toHaveBeenCalled()
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    insertSession.mockRejectedValue(new Error('violates row-level security policy'))

    const error: unknown = await workoutService
      .startSessionFromRoutineDay(USER_ID, DAY_ID)
      .catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('row-level security')
  })
})

describe('workoutService.startSession', () => {
  it('un entrenamiento libre nace sin plan y sin consultar rutinas', async () => {
    const detail = await workoutService.startSession(USER_ID)

    expect(insertSession).toHaveBeenCalledExactlyOnceWith(USER_ID)
    expect(detail.plan).toBeNull()
    expect(detail.stats).toEqual({
      exerciseCount: 0,
      setCount: 0,
      totalVolumeKg: 0,
      durationMinutes: null,
    })
    expect(findRoutineDay).not.toHaveBeenCalled()
  })

  it('recupera el entrenamiento en curso con lo registrado hasta ahora', async () => {
    findActiveSession.mockResolvedValue(session('en-curso'))
    listSetsBySessions.mockResolvedValue([set('s1', 'en-curso', 1), set('s2', 'en-curso', 2)])

    const detail = await workoutService.startSession(USER_ID)

    expect(insertSession).not.toHaveBeenCalled()
    expect(detail.exercises).toHaveLength(1)
    expect(detail.stats.setCount).toBe(2)
    expect(detail.stats.totalVolumeKg).toBe(1200)
  })
})

describe('workoutService.getActiveSession', () => {
  it('sin entrenamiento en curso devuelve nada, sin consultar series', async () => {
    await expect(workoutService.getActiveSession(USER_ID)).resolves.toBeNull()
    expect(listSetsBySessions).not.toHaveBeenCalled()
  })
})

describe('workoutService.logSet', () => {
  it('numera la serie a continuación de la última de ese ejercicio', async () => {
    findLastSetNumber.mockResolvedValue(2)
    insertSet.mockResolvedValue(SAVED_SET)

    await workoutService.logSet({
      sessionId: 's1',
      exerciseId: BENCH.id,
      reps: 8,
      weightKg: 62.5,
    })

    expect(insertSet).toHaveBeenCalledExactlyOnceWith({
      session_id: 's1',
      exercise_id: BENCH.id,
      set_number: 3,
      reps: 8,
      weight: 62.5,
    })
  })

  it('la primera serie de un ejercicio es la número uno', async () => {
    findLastSetNumber.mockResolvedValue(0)
    insertSet.mockResolvedValue(SAVED_SET)

    await workoutService.logSet({ sessionId: 's1', exerciseId: BENCH.id, reps: 10, weightKg: 40 })

    expect(insertSet).toHaveBeenCalledWith(expect.objectContaining({ set_number: 1 }))
  })
})

describe('workoutService.getSessionHistory', () => {
  it('reparte las series entre sus sesiones con una sola consulta', async () => {
    listCompletedSessions.mockResolvedValue([session('s1'), session('s2')])
    listSetsBySessions.mockResolvedValue([
      set('set-1', 's1', 1),
      set('set-2', 's2', 1),
      set('set-3', 's1', 2),
    ])

    const history = await workoutService.getSessionHistory(USER_ID, 10)

    expect(listSetsBySessions).toHaveBeenCalledExactlyOnceWith(['s1', 's2'])
    expect(history[0]?.stats.setCount).toBe(2)
    expect(history[1]?.stats.setCount).toBe(1)
  })

  it('sin entrenamientos no pide series', async () => {
    listCompletedSessions.mockResolvedValue([])

    await expect(workoutService.getSessionHistory(USER_ID, 10)).resolves.toEqual([])
    expect(listSetsBySessions).not.toHaveBeenCalled()
  })
})

describe('workoutService.createExercise', () => {
  it('un grupo muscular no puede ser secundario de sí mismo', async () => {
    insertExercise.mockResolvedValue(SAVED_EXERCISE)

    await workoutService.createExercise(USER_ID, {
      name: 'Press de banca',
      muscleGroup: 'chest',
      equipment: 'barbell',
      secondaryMuscles: ['chest', 'triceps'],
    })

    expect(insertExercise).toHaveBeenCalledWith(
      expect.objectContaining({ secondary_muscles: ['triceps'] }),
    )
  })

  it('una nota vacía no se guarda como cadena vacía', async () => {
    insertExercise.mockResolvedValue(SAVED_EXERCISE)

    await workoutService.createExercise(USER_ID, {
      name: 'Remo',
      muscleGroup: 'back',
      equipment: 'barbell',
    })

    expect(insertExercise.mock.calls[0]?.[0]).not.toHaveProperty('instructions')
  })
})

describe('workoutService.deleteExercise', () => {
  it('explica en cristiano que el ejercicio está en uso', async () => {
    // 23503: la base lo impide con `on delete restrict`.
    deleteExercise.mockRejectedValue({ code: '23503', message: 'violates foreign key constraint' })

    const error: unknown = await workoutService.deleteExercise('ex-1').catch((e) => e)

    expect(error).toEqual({
      code: 'conflict',
      message:
        'No puedes borrar un ejercicio que ya usas en una rutina o un entrenamiento. Quítalo de ahí primero.',
    })
  })
})
