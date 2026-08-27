import { beforeEach, describe, expect, it, vi } from 'vitest'

import { profileRepository } from '../repositories/profile.repository'
import { profileService } from './profile.service'

vi.mock('../repositories/profile.repository', () => ({
  profileRepository: { find: vi.fn(), update: vi.fn() },
}))

const update = vi.mocked(profileRepository.update)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('profileService.save', () => {
  it('sólo escribe lo que se le pasa', () => {
    // El perfil se llena a trozos: la estatura cuando hace falta el IMC, el
    // nombre al entrar por primera vez. Mandar el resto en blanco borraría lo
    // que ya había.
    void profileService.save('u1', { heightCm: 175 })

    expect(update).toHaveBeenCalledWith('u1', { height_cm: 175 })
  })

  it('un valor vacío sí se guarda: borrar es una intención', () => {
    // No es lo mismo «no toques la fecha» que «quítala». Lo primero se omite,
    // lo segundo llega como `null` y tiene que llegar a la base.
    void profileService.save('u1', { birthDate: null })

    expect(update).toHaveBeenCalledWith('u1', { birth_date: null })
  })

  it('sin cambios no manda campos', () => {
    void profileService.save('u1', {})

    expect(update).toHaveBeenCalledWith('u1', {})
  })

  it('traduce los nombres a los de la tabla', () => {
    void profileService.save('u1', { displayName: 'Cristian', sex: 'male' })

    expect(update).toHaveBeenCalledWith('u1', { display_name: 'Cristian', sex: 'male' })
  })
})
