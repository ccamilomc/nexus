// Dueña de la tabla `profiles`: quién es el usuario y los datos de su cuerpo.
// Salud la consume desde aquí para el IMC; nadie más escribe esa tabla.
export { profileKeys, useProfile } from './hooks/use-profile'
export { profileService } from './services/profile.service'
export type { Profile, ProfileChanges } from './types/profile.types'
