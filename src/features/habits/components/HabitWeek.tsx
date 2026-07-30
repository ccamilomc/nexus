import { cn } from '@/shared/lib/utils'

import type { HabitDay } from '../types/habits.types'

interface HabitWeekProps {
  readonly days: readonly HabitDay[]
  /** Nombre del hábito, para que cada día se anuncie con contexto. */
  readonly habitName: string
  readonly disabled: boolean
  readonly onToggle: (day: HabitDay) => void
}

/** Inicial del día de la semana, a partir de la clave `YYYY-MM-DD`. */
const WEEKDAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/**
 * Fecha local a partir de la clave.
 *
 * Se parte a mano: `new Date('2026-07-29')` la interpretaría en UTC y en
 * Colombia mostraría el día anterior.
 */
function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

function initialFor(date: Date): string {
  return WEEKDAY_INITIALS[date.getDay()] ?? '?'
}

/** «29 de julio», para que el lector de pantalla no deletree la clave. */
function describeDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()] ?? ''}`
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
              aria-label={`${habitName}: ${describeDate(date)}, ${isDone ? 'cumplido' : 'sin cumplir'}`}
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
              <span aria-hidden>{initialFor(date)}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
