import { toAppError } from '@/core/error'

import { profileRepository } from '../repositories/profile.repository'
import type { Profile, ProfileChanges } from '../types/profile.types'

/**
 * El perfil del usuario: quien es y los datos de su cuerpo.
 *
 * **Esta feature es la unica duena de la tabla `profiles`.** Antes la leia
 * Salud, porque necesitaba la estatura para el IMC, y al llegar el onboarding
 * habrian quedado dos features escribiendo las mismas columnas. Salud la
 * consume ahora por el barrel, como cualquier otro dominio.
 */
export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    try {
      return await profileRepository.find(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Guarda lo que venga y deja el resto como estaba.
   *
   * Se acepta un cambio parcial porque el perfil se llena a trozos: la estatura
   * cuando hace falta el IMC, el nombre y la fecha al entrar por primera vez. No
   * hay un momento en el que se conozca todo a la vez.
   */
  async save(userId: string, changes: ProfileChanges): Promise<void> {
    try {
      await profileRepository.update(userId, {
        ...(changes.displayName !== undefined && { display_name: changes.displayName }),
        ...(changes.heightCm !== undefined && { height_cm: changes.heightCm }),
        ...(changes.birthDate !== undefined && { birth_date: changes.birthDate }),
        ...(changes.sex !== undefined && { sex: changes.sex }),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Deja anotado que ya paso por la bienvenida, para no volver a ensenarla. */
  async completeOnboarding(userId: string): Promise<void> {
    try {
      await profileRepository.update(userId, { onboarding_completed: true })
    } catch (error) {
      throw toAppError(error)
    }
  },
}
