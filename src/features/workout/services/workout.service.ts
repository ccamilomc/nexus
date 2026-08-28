import { createAppError, isForeignKeyViolation, toAppError } from '@/core/error'
import type { RoutineDaySnapshot } from '@/decision-engine'
import type { DayRange } from '@/shared/utils'

import { workoutRepository } from '../repositories/workout.repository'
import type {
  CreateExerciseValues,
  CreateRoutineValues,
  PastSessionValues,
  RoutineExerciseTargetsValues,
} from '../schemas/workout.schema'
import type {
  Exercise,
  ExerciseProgress,
  LastPerformance,
  LogSetInput,
  Routine,
  RoutineDayDetail,
  RoutineDetail,
  RoutineSummary,
  SessionDetail,
  WorkoutPeriodSeries,
  WorkoutSession,
  WorkoutSetWithExercise,
} from '../types/workout.types'
import { buildExerciseProgress } from '../utils/exercise-progress'
import { buildLastPerformances } from '../utils/last-performance'
import { toPastSessionRange } from '../utils/past-session'
import { buildRoutineDetail } from '../utils/routine-detail'
import { buildRoutineDaySnapshots } from '../utils/routine-snapshots'
import { buildRoutineSummaries } from '../utils/routine-summary'
import { calculateSessionStats, groupSetsByExercise } from '../utils/session-stats'
import { buildWorkoutSeries } from '../utils/workout-series'

/**
 * Cuántas sesiones atrás se busca la última vez que se hizo cada ejercicio.
 *
 * Doce cubren un mes de una rutina de tres días. Un ejercicio que no aparece en
 * un mes no da una referencia útil: el peso de entonces ya no dice qué poner hoy.
 */
const LOOKBACK_SESSIONS = 12

/** Músculos secundarios sin el primario: un grupo no es secundario de sí mismo. */
function secondaryMuscles(values: CreateExerciseValues) {
  return (values.secondaryMuscles ?? []).filter((muscle) => muscle !== values.muscleGroup)
}

/** Compone una sesión con sus series agrupadas y su resumen calculado. */
function toSessionDetail(
  session: WorkoutSession,
  sets: readonly WorkoutSetWithExercise[],
  plan: RoutineDayDetail | null = null,
): SessionDetail {
  const exercises = groupSetsByExercise(sets)
  return { session, exercises, stats: calculateSessionStats(session, exercises), plan }
}

/** Día de rutina que originó la sesión, con sus ejercicios prescritos. */
async function loadPlan(routineDayId: string | null): Promise<RoutineDayDetail | null> {
  if (!routineDayId) return null

  const day = await workoutRepository.findRoutineDay(routineDayId)
  // El día puede haberse borrado después de empezar: la sesión sigue siendo
  // válida, simplemente se queda sin plan.
  if (!day) return null

  return { day, exercises: await workoutRepository.listExercisesByDays([day.id]) }
}

/** Sesión completa: sus series y, si nace de una rutina, su plan. */
async function loadSessionDetail(session: WorkoutSession): Promise<SessionDetail> {
  const sets = await workoutRepository.listSetsBySessions([session.id])
  return toSessionDetail(session, sets, await loadPlan(session.routine_day_id))
}

/** Reglas de negocio de entrenamiento. Traduce errores técnicos a `AppError`. */
export const workoutService = {
  async getExercises(): Promise<Exercise[]> {
    try {
      return await workoutRepository.listExercises()
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Crea un ejercicio propio del usuario (queda como `is_custom`). */
  async createExercise(userId: string, values: CreateExerciseValues): Promise<Exercise> {
    try {
      return await workoutRepository.insertExercise({
        user_id: userId,
        name: values.name,
        muscle_group: values.muscleGroup,
        equipment: values.equipment,
        secondary_muscles: secondaryMuscles(values),
        // Sólo se envía si tiene contenido: una nota vacía es «sin nota», no «''».
        ...(values.instructions ? { instructions: values.instructions } : {}),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Edita un ejercicio propio. La RLS impide tocar los globales.
   *
   * Vaciar las notas las borra (`null`), no las deja como cadena vacía.
   */
  async updateExercise(exerciseId: string, values: CreateExerciseValues): Promise<Exercise> {
    try {
      return await workoutRepository.updateExercise(exerciseId, {
        name: values.name,
        muscle_group: values.muscleGroup,
        equipment: values.equipment,
        secondary_muscles: secondaryMuscles(values),
        instructions: values.instructions ?? null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Borra un ejercicio propio.
   *
   * Si aún se usa en una rutina o en un entrenamiento, la base lo impide
   * (`on delete restrict`); se traduce a un mensaje claro en vez de un error
   * técnico.
   */
  async deleteExercise(exerciseId: string): Promise<void> {
    try {
      await workoutRepository.deleteExercise(exerciseId)
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw createAppError(
          'conflict',
          'No puedes borrar un ejercicio que ya usas en una rutina o un entrenamiento. Quítalo de ahí primero.',
        )
      }
      throw toAppError(error)
    }
  },

  /** Sesión en curso del usuario, con lo registrado hasta ahora. */
  async getActiveSession(userId: string): Promise<SessionDetail | null> {
    try {
      const session = await workoutRepository.findActiveSession(userId)
      return session ? await loadSessionDetail(session) : null
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Inicia un entrenamiento.
   *
   * Sólo puede haber una sesión en curso: si ya existe, se devuelve esa misma.
   * Así una doble pulsación —o dos dispositivos— nunca parten el entrenamiento
   * en dos registros.
   */
  async startSession(userId: string): Promise<SessionDetail> {
    try {
      const active = await workoutRepository.findActiveSession(userId)
      if (active) return await loadSessionDetail(active)

      return toSessionDetail(await workoutRepository.insertSession(userId), [])
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Abre un entrenamiento que ya se hizo, para apuntarlo después.
   *
   * Existe porque no siempre se entrena con el teléfono delante: se va sin él,
   * se queda sin batería o el gimnasio no tiene cobertura. Sin esto, ese día se
   * perdía. Estudio y sueño ya se podían registrar a posteriori; entrenamiento
   * era el único que obligaba a estar conectado mientras.
   *
   * **La sesión nace con su fin ya puesto** y sigue en curso hasta que se cierra.
   * Así la duración que se tecleó sobrevive a una recarga: no hace falta volver
   * a preguntarla al terminar, ni guardarla en la pantalla.
   *
   * Como al empezar en directo, si ya hay un entrenamiento abierto se devuelve
   * ese: nunca se pisa lo que se esté haciendo.
   */
  async startPastSession(userId: string, values: PastSessionValues): Promise<SessionDetail> {
    try {
      const active = await workoutRepository.findActiveSession(userId)
      if (active) return await loadSessionDetail(active)

      const range = toPastSessionRange(values)
      if (!range) {
        throw createAppError('validation', 'Revisa el día y la hora: no se entienden.')
      }

      return toSessionDetail(
        await workoutRepository.insertSession(userId, {
          startedAt: range.startedAt,
          endedAt: range.endedAt,
        }),
        [],
      )
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Inicia un entrenamiento siguiendo un día de rutina.
   *
   * La sesión queda enlazada al día (`routine_day_id`), de donde salen los
   * ejercicios prescritos. Si ya había un entrenamiento en curso se devuelve
   * ese: nunca se pisa lo que el usuario está haciendo.
   */
  async startSessionFromRoutineDay(userId: string, routineDayId: string): Promise<SessionDetail> {
    try {
      const active = await workoutRepository.findActiveSession(userId)
      if (active) return await loadSessionDetail(active)

      const session = await workoutRepository.insertSession(userId, { routineDayId })
      return await loadSessionDetail(session)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Registra una serie al final de las que ya tiene ese ejercicio. */
  /**
   * Registra una serie.
   *
   * Recibe el id y el número de serie ya resueltos porque **la pantalla los
   * necesita antes**: sin red la serie se enseña igual, y para eso hay que
   * saber ya que es la tercera (ADR-0011). El número lo calcula la pantalla,
   * que tiene las series delante, y así se ahorra además una consulta.
   */
  async logSet(input: LogSetInput): Promise<void> {
    try {
      await workoutRepository.insertSet({
        id: input.id,
        session_id: input.sessionId,
        exercise_id: input.exerciseId,
        set_number: input.setNumber,
        reps: input.reps,
        weight: input.weightKg,
        // Los `??` no sobran aunque el tipo diga que vienen siempre: una serie
        // que se quedó en la cola offline con la versión anterior se guardó sin
        // estos dos campos, y al volver la red se envía con este código. Sin
        // ellos entraría `undefined` en la columna.
        is_warmup: input.isWarmup ?? false,
        rpe: input.rpe ?? null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Elimina una serie (borrado lógico, para poder sincronizarlo offline). */
  async removeSet(setId: string): Promise<void> {
    try {
      await workoutRepository.softDeleteSet(setId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Cierra el entrenamiento y lo deja disponible en el historial. */
  /**
   * Cierra el entrenamiento.
   *
   * `endedAt` sólo llega cuando la sesión ya traía su fin puesto —un
   * entrenamiento apuntado después—, y entonces se respeta: la duración es la
   * que se tecleó, no el rato que se tardó en escribir las series.
   */
  async finishSession(sessionId: string, endedAt?: string | null): Promise<void> {
    try {
      await workoutRepository.updateSession(sessionId, {
        status: 'completed',
        ended_at: endedAt ?? new Date().toISOString(),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Vuelve a abrir un entrenamiento del historial para corregirlo.
   *
   * Un peso mal tecleado, un ejercicio que no era o una serie de más quedaban
   * ahí para siempre: la única salida era descartar la sesión en curso, y una ya
   * guardada no lo está. Reabrirla la devuelve a la pantalla de siempre, donde
   * las series se añaden y se quitan.
   *
   * **Conserva el fin que tuviera**, así que se edita como un entrenamiento
   * apuntado a posteriori: con su fecha y su duración, sin cronómetro. Ponerlo a
   * cero haría que un entrenamiento de hace tres días apareciera durando tres
   * días.
   *
   * No se reabre nada si hay otro en curso: dos sesiones abiertas a la vez es
   * justo lo que el resto del módulo evita.
   */
  async reopenSession(userId: string, sessionId: string): Promise<void> {
    try {
      const active = await workoutRepository.findActiveSession(userId)
      if (active) {
        throw createAppError(
          'conflict',
          'Tienes un entrenamiento en curso. Termínalo o descártalo antes de corregir otro.',
        )
      }

      await workoutRepository.updateSession(sessionId, { status: 'in_progress' })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Quita un entrenamiento del historial.
   *
   * Soft delete: sale de la aplicación pero la fila se queda, como el resto del
   * proyecto. **Mantiene `status` en `completed`** a diferencia de descartar uno
   * en curso: aquello nunca llegó a contar, y esto sí ocurrió y se borra.
   */
  async removeSession(sessionId: string): Promise<void> {
    try {
      await workoutRepository.updateSession(sessionId, { deleted_at: new Date().toISOString() })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Descarta el entrenamiento: desaparece de la aplicación sin borrarse de la
   * base (`deleted_at`) y queda marcado como no realizado.
   */
  async discardSession(sessionId: string): Promise<void> {
    try {
      await workoutRepository.updateSession(sessionId, {
        status: 'skipped',
        deleted_at: new Date().toISOString(),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Entrenamientos terminados, del más reciente al más antiguo. */
  async getSessionHistory(userId: string, limit: number): Promise<SessionDetail[]> {
    try {
      const sessions = await workoutRepository.listCompletedSessions(userId, limit)
      if (sessions.length === 0) return []

      const sets = await workoutRepository.listSetsBySessions(sessions.map(({ id }) => id))
      const setsBySession = new Map<string, WorkoutSetWithExercise[]>()
      for (const set of sets) {
        const current = setsBySession.get(set.session_id)
        if (current) current.push(set)
        else setsBySession.set(set.session_id, [set])
      }

      return sessions.map((session) =>
        toSessionDetail(session, setsBySession.get(session.id) ?? []),
      )
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Qué se hizo la última vez en cada ejercicio.
   *
   * Se miran las últimas `LOOKBACK_SESSIONS` sesiones y no todo el historial: es
   * una consulta acotada que cubre de sobra una rutina por días —con tres días
   * distintos, doce sesiones son un mes— y un ejercicio que no sale en un mes no
   * tiene una referencia útil que dar.
   *
   * Reutiliza las dos consultas del historial en vez de una nueva: es la misma
   * pregunta con otro corte.
   */
  async getLastPerformances(userId: string): Promise<LastPerformance[]> {
    try {
      const sessions = await workoutRepository.listCompletedSessions(userId, LOOKBACK_SESSIONS)
      if (sessions.length === 0) return []

      const sets = await workoutRepository.listSetsBySessions(sessions.map(({ id }) => id))

      return buildLastPerformances(sessions, sets)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Qué ejercicios se han entrenado alguna vez, para saber cuáles tienen marcas. */
  async getTrainedExerciseIds(userId: string): Promise<string[]> {
    try {
      return await workoutRepository.listTrainedExerciseIds(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Lo mejor que se ha hecho en un ejercicio, y cómo se llegó ahí.
   *
   * Se pide sólo al abrir un ejercicio: son dieciséis en el catálogo y traerlos
   * todos al listar sería pagar dieciséis consultas para enseñar una.
   */
  async getExerciseProgress(userId: string, exerciseId: string): Promise<ExerciseProgress> {
    try {
      const samples = await workoutRepository.listSetsForExercise(userId, exerciseId)

      return buildExerciseProgress(exerciseId, samples)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * El entrenamiento de un periodo y el del tramo anterior, para Analytics.
   *
   * Dos consultas encadenadas y no más: las sesiones de los dos tramos (que son
   * contiguos) y, con sus ids, las series que hacen falta para el volumen.
   */
  async getSeries(
    userId: string,
    range: DayRange,
    previousRange: DayRange,
    days: readonly Date[],
    previousDays: readonly Date[],
  ): Promise<WorkoutPeriodSeries> {
    try {
      const sessions = await workoutRepository.listCompletedSessionsBetween(
        userId,
        previousRange.fromIso,
        range.toIso,
      )

      const sets = await workoutRepository.listSetsForVolume(sessions.map(({ id }) => id))

      return buildWorkoutSeries(sessions, sets, days, previousDays)
    } catch (error) {
      throw toAppError(error)
    }
  },

  // ─── Rutinas ────────────────────────────────────────────────────────────
  /** Rutinas del usuario, de la más reciente a la más antigua. */
  async getRoutines(userId: string): Promise<Routine[]> {
    try {
      return await workoutRepository.listRoutines(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Las rutinas con cuánta es cada una y cuándo se usó por última vez.
   *
   * Cuatro consultas en paralelo y no una por rutina: quien tiene tres rutinas
   * no debería pagar tres viajes por cada dato. Se agrega en el cliente, como el
   * resto ([ADR-0006](../../../../docs/adr/0006-analytics-agrega-en-el-cliente.md)).
   */
  async getRoutineSummaries(userId: string): Promise<RoutineSummary[]> {
    try {
      const routines = await workoutRepository.listRoutines(userId)
      if (routines.length === 0) return []

      const days = await workoutRepository.listDaysByRoutines(routines.map(({ id }) => id))
      const [exercises, usage] = await Promise.all([
        workoutRepository.listExercisesByDays(days.map(({ id }) => id)),
        workoutRepository.listRoutineDayUsage(userId),
      ])

      return buildRoutineSummaries(routines, days, exercises, usage)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createRoutine(userId: string, values: CreateRoutineValues): Promise<Routine> {
    try {
      return await workoutRepository.insertRoutine({
        user_id: userId,
        name: values.name,
        ...(values.goal ? { goal: values.goal } : {}),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Rutina con sus días y ejercicios prescritos, o `null` si no existe. */
  /**
   * Todos los días de rutina del usuario, con sus ejercicios prescritos.
   *
   * Lo consume el Decision Engine para poder proponer una versión corta: sin
   * saber qué se planea entrenar, sugerir «haz media sesión» no dice nada.
   */
  async getRoutineDays(userId: string): Promise<readonly RoutineDaySnapshot[]> {
    try {
      const routines = await workoutRepository.listRoutines(userId)
      if (routines.length === 0) return []

      const days = await workoutRepository.listDaysByRoutines(routines.map(({ id }) => id))
      if (days.length === 0) return []

      const exercises = await workoutRepository.listExercisesByDays(days.map(({ id }) => id))

      return buildRoutineDaySnapshots(routines, days, exercises)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async getRoutineDetail(routineId: string): Promise<RoutineDetail | null> {
    try {
      const routine = await workoutRepository.findRoutine(routineId)
      if (!routine) return null

      const days = await workoutRepository.listDays(routineId)
      const exercises = await workoutRepository.listExercisesByDays(days.map(({ id }) => id))
      return buildRoutineDetail(routine, days, exercises)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async addRoutineDay(routineId: string, name: string): Promise<void> {
    try {
      await workoutRepository.insertRoutineDay(routineId, name)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Prescribe un ejercicio en un día, con sus objetivos opcionales. */
  async addRoutineExercise(
    dayId: string,
    exerciseId: string,
    targets: RoutineExerciseTargetsValues,
  ): Promise<void> {
    try {
      await workoutRepository.insertRoutineExercise({
        routine_day_id: dayId,
        exercise_id: exerciseId,
        ...(targets.targetSets !== undefined ? { target_sets: targets.targetSets } : {}),
        ...(targets.targetReps !== undefined ? { target_reps: targets.targetReps } : {}),
        ...(targets.targetWeightKg !== undefined ? { target_weight: targets.targetWeightKg } : {}),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  async removeRoutineDay(dayId: string): Promise<void> {
    try {
      await workoutRepository.deleteRoutineDay(dayId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async removeRoutineExercise(routineExerciseId: string): Promise<void> {
    try {
      await workoutRepository.deleteRoutineExercise(routineExerciseId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Borra la rutina (borrado lógico: `deleted_at`, para sincronizarlo offline). */
  async deleteRoutine(routineId: string): Promise<void> {
    try {
      await workoutRepository.updateRoutine(routineId, { deleted_at: new Date().toISOString() })
    } catch (error) {
      throw toAppError(error)
    }
  },
}
