import { cn } from '@/shared/lib/utils'

import type { HabitDay } from '../types/habits.types'
import { formatDayAndMonth, parseDateKey, weekdayInitial } from '../utils/format'

interface HabitWeekProps {
  readonly days: readonly HabitDay[]
  /** Nombre del hábito, para que cada día se anuncie con contexto. */
  readonly habitName: string
  readonly disabled: boolean
  readonly onToggle: (day: HabitDay) => void
}

/**
 * Últimos días de un hábito, de un vistazo y **corregibles**.
 *
 * Olvidarse de marcar ayer es lo más común que le pasa a un hábito: el dato y
 * la fecha ya están en pantalla, así que cada día es un interruptor. Los
 * anteriores a la creación del hábito se muestran apagados y no se pueden
 * tocar.
 */
export function HabitWeek({ days, habitName, disabled, onToggle }: HabitWeekProps) {
  return (
    <ul className="flex gap-1">
      {days.map((day) => {
        const { dateKey, isDone, isEditable } = day
        const date = parseDateKey(dateKey)

        return (
          <li key={dateKey}>
            <button
              type="button"
              role="switch"
              aria-checked={isDone}
              // El contenido visible es una sola letra: el nombre accesible se
              // da aparte para que se anuncie el hábito y el día completos.
              aria-label={`${habitName}: ${formatDayAndMonth(date)}, ${isDone ? 'cumplido' : 'sin cumplir'}`}
              // 36 px: por debajo de los 44 recomendados, pero son siete
              // controles seguidos y no caben más grandes en 320 px. Con la
              // separación entre ellos se cumple igualmente el mínimo táctil.
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                isEditable && !disabled ? 'hover:opacity-80' : 'cursor-not-allowed opacity-50',
              )}
              disabled={disabled || !isEditable}
              onClick={() => onToggle(day)}
            >
              <span aria-hidden>{weekdayInitial(date)}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
