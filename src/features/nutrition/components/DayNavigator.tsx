import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { minusDays, toDateKey } from '@/shared/utils'

import { formatDayLabel } from '../utils/format'

interface DayNavigatorProps {
  readonly date: Date
  readonly today: Date
  readonly onChange: (date: Date) => void
}

/**
 * Moverse al día que se quiere apuntar o revisar.
 *
 * **Olvidarse de apuntar la cena es lo más común que le pasa a la comida**, y
 * hasta ahora la pantalla estaba clavada en hoy: lo de ayer no se podía ni ver
 * ni corregir. Hábitos ya deja arreglar días pasados por el mismo motivo, y
 * salud y entrenamiento dejan fechar lo que se apunta tarde.
 *
 * **No se va al futuro**: no se ha comido todavía. Por eso la flecha derecha se
 * apaga en el día de hoy en vez de desaparecer, para que el control no cambie de
 * sitio al llegar al final.
 */
export function DayNavigator({ date, today, onChange }: DayNavigatorProps) {
  const isToday = toDateKey(date) === toDateKey(today)

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Ver el día anterior"
        onClick={() => onChange(minusDays(date, 1))}
      >
        <ChevronLeft aria-hidden />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col items-center">
        {/* `aria-live`: al pulsar la flecha el foco se queda en ella, así que sin
            esto un lector de pantalla no diría a qué día se ha llegado. */}
        <p className="truncate text-sm font-medium" aria-live="polite">
          {formatDayLabel(date, today)}
        </p>
        {isToday ? null : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => onChange(today)}
          >
            Volver a hoy
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        // Mañana no se ha comido: se apaga en vez de esconderse, para que las
        // flechas no bailen de sitio.
        disabled={isToday}
        aria-label="Ver el día siguiente"
        onClick={() => onChange(minusDays(date, -1))}
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  )
}
