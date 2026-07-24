import { supabase, type Tables } from '@/core/supabase'

export type Exercise = Tables<'exercises'>

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
}
