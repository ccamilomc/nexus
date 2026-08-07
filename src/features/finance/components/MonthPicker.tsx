import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'

interface MonthPickerProps {
  readonly month: Date
  readonly onChange: (month: Date) => void
  /** Hoy, para no dejar avanzar a meses que aún no han pasado. */
  readonly today: Date
}

const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })

/** El primer día del mes de una fecha, desplazado `offset` meses. */
function shiftMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

/**
 * Qué mes se está mirando.
 *
 * **No se avanza más allá del mes en curso.** Un mes futuro sólo puede enseñar
 * ceros, y un cero que no distingue «no gasté» de «todavía no ha pasado» hace
 * dudar de la cifra.
 */
export function MonthPicker({ month, onChange, today }: MonthPickerProps) {
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Mes anterior"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft aria-hidden />
      </Button>

      {/* `aria-live` porque al pulsar las flechas lo único que cambia es este
          texto: sin él, quien no ve la pantalla no se entera de dónde está. */}
      {/* `first-letter` y no `capitalize`: en español sólo va en mayúscula el
          nombre del mes, y `capitalize` escribía «Agosto De 2026». */}
      <p aria-live="polite" className="text-sm font-medium first-letter:uppercase">
        {monthFormatter.format(month)}
      </p>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Mes siguiente"
        disabled={isCurrentMonth}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  )
}
