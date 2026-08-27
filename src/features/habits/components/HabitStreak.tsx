import { Flame } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

interface HabitStreakProps {
  readonly streak: number
  /** Días desde la última vez; `null` si no consta ninguna. */
  readonly daysSinceDone: number | null
}

/** Concuerda en singular y plural: «1 día seguido», «3 días seguidos». */
function formatStreak(streak: number): string {
  return streak === 1 ? '1 día seguido' : `${streak} días seguidos`
}

/**
 * Qué decir cuando no hay racha.
 *
 * **Aquí la última vez fue hace dos días o más, siempre.** Si hubiera sido ayer
 * u hoy habría racha —la racha no se rompe mientras el día no acabe—, así que
 * este texto nunca dice «ayer» y el plural nunca falla.
 */
function describeGap(daysSinceDone: number | null): string {
  if (daysSinceDone === null || daysSinceDone === 0) return 'Sin racha todavía'

  return `${daysSinceDone} días sin hacerlo`
}

/**
 * Racha del hábito, o cuánto lleva sin hacerse.
 *
 * Celebración discreta: la llama sólo se enciende cuando hay racha. Sin ella no
 * se recrimina nada (la gamificación motiva, nunca castiga; ver
 * docs/11-ux-ui-y-diseno.md).
 *
 * **Cuando no hay racha se dice desde cuándo**, que es lo que «Sin racha
 * todavía» callaba: con tres hábitos sin marcar, el que hay que atender es el
 * que lleva más tiempo cayéndose, y ese dato estaba en la pantalla convertido en
 * cuadritos que había que leer uno a uno. Va en gris y en días, sin adjetivos:
 * es un hecho, no un reproche.
 *
 * Con un hábito que aún no se ha marcado nunca no se cuenta nada, porque no se
 * ha dejado de hacer.
 */
export function HabitStreak({ streak, daysSinceDone }: HabitStreakProps) {
  const hasStreak = streak > 0

  return (
    <p
      className={cn(
        'flex items-center gap-1 text-xs',
        hasStreak ? 'font-medium text-warning' : 'text-muted-foreground',
      )}
    >
      <Flame className="h-3.5 w-3.5" aria-hidden />
      {hasStreak ? formatStreak(streak) : describeGap(daysSinceDone)}
    </p>
  )
}
