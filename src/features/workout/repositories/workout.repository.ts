import { supabase, type TablesInsert, type TablesUpdate } from '@/core/supabase'

import type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSetWithExercise,
} from '../types/workout.types'

/** Serie con los datos del ejercicio que la interfaz necesita mostrar. */
const SET_WITH_EXERCISE = '*, exercise:exercises(id, name, muscle_group, equipment)'

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
}
