import { supabase, type TablesInsert, type TablesUpdate } from '@/core/supabase'

import type {
  Exercise,
  ExerciseSetSample,
  Routine,
  RoutineDay,
  RoutineExercise,
  RoutineExerciseWithExercise,
  SessionSample,
  VolumeSetSample,
  WorkoutSession,
  WorkoutSet,
  WorkoutSetWithExercise,
} from '../types/workout.types'

/** Serie con los datos del ejercicio que la interfaz necesita mostrar. */
const SET_WITH_EXERCISE = '*, exercise:exercises(id, name, muscle_group, equipment)'

/** Ejercicio prescrito con los datos del ejercicio al que referencia. */
const ROUTINE_EXERCISE_WITH_EXERCISE = '*, exercise:exercises(id, name, muscle_group, equipment)'

/** Siguiente `order_index` de los días de una rutina (0 si no hay ninguno). */
async function nextDayOrder(routineId: string): Promise<number> {
  const { data, error } = await supabase
    .from('routine_days')
    .select('order_index')
    .eq('routine_id', routineId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data?.order_index ?? -1) + 1
}

/** Siguiente `order_index` de los ejercicios de un día (0 si no hay ninguno). */
async function nextExerciseOrder(dayId: string): Promise<number> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('order_index')
    .eq('routine_day_id', dayId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data?.order_index ?? -1) + 1
}

/** Acceso a datos de entrenamiento. Sólo habla con Supabase; sin reglas de negocio. */
export const workoutRepository = {
  async listExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('muscle_group', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async insertExercise(input: TablesInsert<'exercises'>): Promise<Exercise> {
    const { data, error } = await supabase.from('exercises').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async updateExercise(exerciseId: string, patch: TablesUpdate<'exercises'>): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .update(patch)
      .eq('id', exerciseId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async deleteExercise(exerciseId: string): Promise<void> {
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId)

    if (error) throw error
  },

  async findActiveSession(userId: string): Promise<WorkoutSession | null> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .is('deleted_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async insertSession(
    userId: string,
    input: { routineDayId?: string; startedAt?: string; endedAt?: string } = {},
  ): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        ...(input.routineDayId ? { routine_day_id: input.routineDayId } : {}),
        // Sin fecha, la base pone el ahora: es el caso de entrenar con la
        // aplicación delante.
        ...(input.startedAt ? { started_at: input.startedAt } : {}),
        ...(input.endedAt ? { ended_at: input.endedAt } : {}),
      })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async updateSession(
    sessionId: string,
    patch: TablesUpdate<'workout_sessions'>,
  ): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(patch)
      .eq('id', sessionId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async listCompletedSessions(userId: string, limit: number): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data ?? []
  },

  /**
   * Entrenamientos terminados dentro de un rango, del más antiguo al más nuevo.
   *
   * Se acota por instante (no por fecha) porque `started_at` es `timestamptz`:
   * el rango ya viene calculado en hora local (ver `dayRange`).
   */
  async listCompletedSessionsBetween(
    userId: string,
    fromIso: string,
    toIso: string,
  ): Promise<SessionSample[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('id, started_at, ended_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .gte('started_at', fromIso)
      .lt('started_at', toIso)
      .order('started_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /**
   * Las series de varias sesiones, sólo con lo que hace falta para el volumen.
   *
   * Sin el join del ejercicio ni las columnas que no se agregan: en 90 días
   * son miles de filas y el nombre del ejercicio no se dibuja en la serie.
   */
  async listSetsForVolume(sessionIds: readonly string[]): Promise<VolumeSetSample[]> {
    if (sessionIds.length === 0) return []

    const { data, error } = await supabase
      .from('workout_sets')
      .select('session_id, reps, weight, is_warmup, completed')
      .in('session_id', sessionIds)
      .is('deleted_at', null)

    if (error) throw error
    return data ?? []
  },

  /**
   * Todas las series de **un** ejercicio, con la fecha de su entrenamiento.
   *
   * Trae el historial entero de ese ejercicio y no un tramo: un récord personal
   * que se olvida de lo de hace seis meses no es un récord. Son las series de un
   * solo ejercicio, así que la cifra se mantiene pequeña —unas pocas por sesión—
   * y sólo se pide al abrirlo.
   *
   * El `!inner` sobre la sesión es lo que deja filtrar por su estado: sin él
   * entrarían los entrenamientos descartados y a medias.
   */
  async listSetsForExercise(userId: string, exerciseId: string): Promise<ExerciseSetSample[]> {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('reps, weight, is_warmup, session:workout_sessions!inner(id, started_at, ended_at)')
      .eq('exercise_id', exerciseId)
      .is('deleted_at', null)
      .eq('session.user_id', userId)
      .eq('session.status', 'completed')
      .is('session.deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /**
   * Qué ejercicios se han entrenado alguna vez.
   *
   * Sólo la columna del ejercicio: con esto la lista sabe en cuáles ofrecer las
   * marcas y en cuáles no, sin traerse una serie entera para averiguarlo.
   */
  async listTrainedExerciseIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('exercise_id, session:workout_sessions!inner(user_id, status, deleted_at)')
      .is('deleted_at', null)
      .eq('session.user_id', userId)
      .eq('session.status', 'completed')
      .is('session.deleted_at', null)

    if (error) throw error
    return [...new Set((data ?? []).map(({ exercise_id }) => exercise_id))]
  },

  async listSetsBySessions(sessionIds: readonly string[]): Promise<WorkoutSetWithExercise[]> {
    if (sessionIds.length === 0) return []

    const { data, error } = await supabase
      .from('workout_sets')
      .select(SET_WITH_EXERCISE)
      .in('session_id', sessionIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /**
   * Último número de serie usado para un ejercicio dentro de la sesión.
   *
   * Incluye a propósito las series borradas: el número no se reutiliza, de modo
   * que el orden de registro se mantiene estable aunque se elimine una serie.
   */
  async findLastSetNumber(sessionId: string, exerciseId: string): Promise<number> {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('set_number')
      .eq('session_id', sessionId)
      .eq('exercise_id', exerciseId)
      .order('set_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data?.set_number ?? 0
  },

  async insertSet(input: TablesInsert<'workout_sets'>): Promise<WorkoutSet> {
    const { data, error } = await supabase.from('workout_sets').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async softDeleteSet(setId: string, deletedAt: string): Promise<void> {
    const { error } = await supabase
      .from('workout_sets')
      .update({ deleted_at: deletedAt })
      .eq('id', setId)

    if (error) throw error
  },

  // ─── Rutinas ────────────────────────────────────────────────────────────
  async listRoutines(userId: string): Promise<Routine[]> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async findRoutine(routineId: string): Promise<Routine | null> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async insertRoutine(input: TablesInsert<'routines'>): Promise<Routine> {
    const { data, error } = await supabase.from('routines').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async updateRoutine(routineId: string, patch: TablesUpdate<'routines'>): Promise<void> {
    const { error } = await supabase.from('routines').update(patch).eq('id', routineId)

    if (error) throw error
  },

  async findRoutineDay(dayId: string): Promise<RoutineDay | null> {
    const { data, error } = await supabase
      .from('routine_days')
      .select('*')
      .eq('id', dayId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async listDays(routineId: string): Promise<RoutineDay[]> {
    const { data, error } = await supabase
      .from('routine_days')
      .select('*')
      .eq('routine_id', routineId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /**
   * Los días de varias rutinas de una vez.
   *
   * El motor necesita **todos** los días para saber cuál toca por rotación, y
   * pedirlos rutina a rutina sería una consulta por cada una.
   */
  async listDaysByRoutines(routineIds: readonly string[]): Promise<RoutineDay[]> {
    if (routineIds.length === 0) return []

    const { data, error } = await supabase
      .from('routine_days')
      .select('*')
      .in('routine_id', routineIds)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async listExercisesByDays(dayIds: readonly string[]): Promise<RoutineExerciseWithExercise[]> {
    if (dayIds.length === 0) return []

    const { data, error } = await supabase
      .from('routine_exercises')
      .select(ROUTINE_EXERCISE_WITH_EXERCISE)
      .in('routine_day_id', dayIds)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async insertRoutineDay(routineId: string, name: string): Promise<RoutineDay> {
    const orderIndex = await nextDayOrder(routineId)
    const { data, error } = await supabase
      .from('routine_days')
      .insert({ routine_id: routineId, name, order_index: orderIndex })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async insertRoutineExercise(
    input: Omit<TablesInsert<'routine_exercises'>, 'order_index'>,
  ): Promise<RoutineExercise> {
    const orderIndex = await nextExerciseOrder(input.routine_day_id)
    const { data, error } = await supabase
      .from('routine_exercises')
      .insert({ ...input, order_index: orderIndex })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async deleteRoutineDay(dayId: string): Promise<void> {
    const { error } = await supabase.from('routine_days').delete().eq('id', dayId)

    if (error) throw error
  },

  async deleteRoutineExercise(routineExerciseId: string): Promise<void> {
    const { error } = await supabase.from('routine_exercises').delete().eq('id', routineExerciseId)

    if (error) throw error
  },
}
