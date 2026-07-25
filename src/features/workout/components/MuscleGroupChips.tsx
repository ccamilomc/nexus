import type { Enums } from '@/core/supabase'
import { cn } from '@/shared/lib/utils'

import { MUSCLE_GROUP_OPTIONS } from '../constants/workout.constants'

type MuscleGroup = Enums<'muscle_group'>

interface MuscleGroupChipsProps {
  readonly value: readonly MuscleGroup[]
  readonly onChange: (next: MuscleGroup[]) => void
  /** Grupo a ocultar (el primario, que no puede ser secundario de sí mismo). */
  readonly exclude?: MuscleGroup
}

/** Selección múltiple de grupos musculares mediante chips que se alternan. */
export function MuscleGroupChips({ value, onChange, exclude }: MuscleGroupChipsProps) {
  const toggle = (muscle: MuscleGroup) => {
    onChange(value.includes(muscle) ? value.filter((m) => m !== muscle) : [...value, muscle])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {MUSCLE_GROUP_OPTIONS.filter((option) => option.value !== exclude).map((option) => {
        const active = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
