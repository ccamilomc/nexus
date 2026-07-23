import { type LucideIcon, Monitor, Moon, Sun } from 'lucide-react'

import { useThemeStore } from '@/core/theme/theme.store'
import type { ThemePreference } from '@/core/theme/theme.types'
import { cn } from '@/shared/lib/utils'

interface ThemeOption {
  readonly value: ThemePreference
  readonly label: string
  readonly Icon: LucideIcon
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', label: 'Tema claro', Icon: Sun },
  { value: 'dark', label: 'Tema oscuro', Icon: Moon },
  { value: 'system', label: 'Según el sistema', Icon: Monitor },
]

export function ThemeToggle() {
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)

  return (
    <div
      role="group"
      aria-label="Tema de la interfaz"
      className="inline-flex items-center gap-1 rounded-lg border border-border p-1"
    >
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const isActive = preference === value

        return (
          <button
            key={value}
            type="button"
            onClick={() => {
              setPreference(value)
            }}
            aria-pressed={isActive}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
