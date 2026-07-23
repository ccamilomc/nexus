import type { ResolvedTheme, ThemePreference } from '@/core/theme/theme.types'

/**
 * Resuelve la preferencia del usuario al tema final. Función pura: recibe el
 * estado del sistema en lugar de consultarlo, para poder probarla.
 */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}
