import { supabase, type TablesInsert, type TablesUpdate } from '@/core/supabase'

import type {
  Exercise,
  Routine,
  RoutineDay,
  RoutineExercise,
  RoutineExerciseWithExercise,
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

  async insertSession(userId: string): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId })
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

  async listDays(routineId: string): Promise<RoutineDay[]> {
    const { data, error } = await supabase
      .from('routine_days')
      .select('*')
      .eq('routine_id', routineId)
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
