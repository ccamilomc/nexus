import type { Tables } from '@/core/supabase'

export type Profile = Tables<'profiles'>

/**
 * Los datos del perfil que el usuario puede cambiar.
 *
 * Todos opcionales y todos anulables: **nada de esto hace falta para usar
 * Nexus**. La estatura sirve para el IMC, y la fecha de nacimiento y el sexo
 * sólo para proponer una cifra de calorías; quien no los dé sigue teniendo la
 * aplicación entera, sólo que sin esa sugerencia.
 */
export interface ProfileChanges {
  readonly displayName?: string | null
  readonly heightCm?: number | null
  readonly birthDate?: string | null
  readonly sex?: Profile['sex']
}
