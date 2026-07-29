import { cn } from '@/shared/lib/utils'

import type { HabitDay } from '../types/habits.types'

interface HabitWeekProps {
  readonly days: readonly HabitDay[]
}

/** Inicial del día de la semana, a partir de la clave `YYYY-MM-DD`. */
const WEEKDAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function initialFor(dateKey: string): string {
  // Se parte la clave a mano: `new Date('2026-07-29')` la interpretaría en UTC
  // y en Colombia mostraría el día anterior.
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)

  return WEEKDAY_INITIALS[date.getDay()] ?? '?'
}

/** Últimos días de un hábito, de un vistazo. */
export function HabitWeek({ days }: HabitWeekProps) {
  return (
    <ul className="flex gap-1">
      {days.map(({ dateKey, isDone }) => (
        <li key={dateKey}>
          <span
            title={dateKey}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium',
              isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            <span className="sr-only">
              {dateKey}: {isDone ? 'cumplido' : 'sin cumplir'}
            </span>
            <span aria-hidden>{initialFor(dateKey)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
