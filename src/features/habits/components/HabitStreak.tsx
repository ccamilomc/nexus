import { Flame } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

interface HabitStreakProps {
  readonly streak: number
}

/**
 * Racha del hábito.
 *
 * Celebración discreta: la llama sólo se enciende cuando hay racha. Sin ella
 * no se recrimina nada, sólo se dice que aún no empieza (la gamificación
 * motiva, nunca castiga; ver docs/11-ux-ui-y-diseno.md).
 */
export function HabitStreak({ streak }: HabitStreakProps) {
  const hasStreak = streak > 0

  return (
    <p
      className={cn(
        'flex items-center gap-1 text-xs',
        hasStreak ? 'font-medium text-warning' : 'text-muted-foreground',
      )}
    >
      <Flame className="h-3.5 w-3.5" aria-hidden />
      {hasStreak ? `${streak} ${streak === 1 ? 'día' : 'días'} seguidos` : 'Sin racha todavía'}
    </p>
  )
}
