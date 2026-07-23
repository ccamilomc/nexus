import { type PropsWithChildren, useEffect } from 'react'

import { resolveTheme } from '@/core/theme/resolve-theme'
import { useThemeStore } from '@/core/theme/theme.store'

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

/**
 * Aplica el tema al documento y lo mantiene sincronizado con el sistema cuando
 * la preferencia es `system`. Los componentes nunca leen el tema: consumen
 * design tokens (ver docs/11-ux-ui-y-diseno.md).
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const preference = useThemeStore((state) => state.preference)

  useEffect(() => {
    const media = window.matchMedia(DARK_MEDIA_QUERY)

    const applyTheme = () => {
      const resolved = resolveTheme(preference, media.matches)
      const root = document.documentElement
      root.classList.toggle('dark', resolved === 'dark')
      root.style.colorScheme = resolved
    }

    applyTheme()
    media.addEventListener('change', applyTheme)

    return () => {
      media.removeEventListener('change', applyTheme)
    }
  }, [preference])

  return <>{children}</>
}
