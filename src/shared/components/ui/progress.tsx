import { cn } from '@/shared/lib/utils'

/**
 * Qué significa el avance, que no siempre es lo mismo.
 *
 * Pasarse preocupa si son calorías o gasto (`warning`) y es un logro si son
 * horas de estudio (`success`). Va en un solo eje a propósito: con dos
 * banderas sueltas se podía pedir «cumplido» y «pasado» a la vez.
 */
type ProgressTone = 'default' | 'success' | 'warning'

const TONE_CLASS: Record<ProgressTone, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
}

interface ProgressProps {
  /** Porcentaje ya recorrido, de 0 a 100. */
  readonly value: number
  /** Qué mide la barra; lo anuncian los lectores de pantalla. */
  readonly label: string
  readonly tone?: ProgressTone
  readonly className?: string
}

/**
 * Barra de avance hacia un objetivo.
 *
 * Es `role="progressbar"` con sus valores ARIA: quien no ve la barra recibe
 * el mismo dato. El color no es la única señal (el texto acompaña siempre).
 */
export function Progress({ value, label, tone = 'default', className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width]', TONE_CLASS[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
