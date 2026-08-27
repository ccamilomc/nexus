import { supabase, type TablesUpdate } from '@/core/supabase'

import type { Profile } from '../types/profile.types'

/** Acceso al perfil. Sólo habla con Supabase; sin reglas de negocio. */
export const profileRepository = {
  async find(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async update(userId: string, changes: TablesUpdate<'profiles'>): Promise<void> {
    const { error } = await supabase.from('profiles').update(changes).eq('id', userId)

    if (error) throw error
  },
}
