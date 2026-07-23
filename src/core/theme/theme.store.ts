import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ThemePreference } from '@/core/theme/theme.types'

interface ThemeState {
  readonly preference: ThemePreference
  readonly setPreference: (preference: ThemePreference) => void
}

/**
 * Estado global de UI del tema (Zustand). Se persiste en el navegador para que
 * la elección sobreviva a recargas. Cuando exista autenticación (Sprint 4) se
 * sincronizará además con `user_preferences`.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'dark',
      setPreference: (preference) => {
        set({ preference })
      },
    }),
    { name: 'nexus:theme', version: 1 },
  ),
)
