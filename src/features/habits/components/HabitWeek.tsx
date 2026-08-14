import { cn } from '@/shared/lib/utils'
import { parseDateKey } from '@/shared/utils'

import type { HabitDay } from '../types/habits.types'
import { formatDayAndMonth, weekdayInitial } from '../utils/format'

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
        const { dateKey, isDone, isToday, isEditable } = day
        const date = parseDateKey(dateKey)

        return (
          <li key={dateKey}>
            <button
              type="button"
              role="switch"
              aria-checked={isDone}
              // El contenido visible es una sola letra: el nombre accesible se
              // da aparte para que se anuncie el hábito y el día completos. Hoy
              // se nombra «hoy», que es como se piensa, y no por su fecha.
              aria-label={`${habitName}: ${isToday ? 'hoy' : formatDayAndMonth(date)}, ${isDone ? 'cumplido' : 'sin cumplir'}`}
              // 36 px: por debajo de los 44 recomendados, pero son siete
              // controles seguidos y no caben más grandes en 320 px. Con la
              // separación entre ellos se cumple igualmente el mínimo táctil.
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                // El día sin cumplir lleva el color de texto normal, no el
                // atenuado: gris tenue sobre fondo gris se quedaba en 4,4 de
                // contraste sobre el tema claro, por debajo del 4,5 de la WCAG
                // AA. Lo que distingue un día cumplido de otro es el fondo
                // índigo, no lo flojo que se lea la letra.
                isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                // Hoy va con borde: siete letras seguidas no dicen dónde estás,
                // y este calendario existe para corregir el día que toque. Borde
                // y no anillo, que es lo que usa el foco del teclado.
                isToday && 'border-2 border-foreground/40',
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
