import { cn } from '@/shared/lib/utils'

interface ProgressProps {
  /** Porcentaje ya recorrido, de 0 a 100. */
  readonly value: number
  /** Qué mide la barra; lo anuncian los lectores de pantalla. */
  readonly label: string
  /** Marca que se superó el objetivo (no siempre es malo: depende del dato). */
  readonly isExceeded?: boolean
  readonly className?: string
}

/**
 * Barra de avance hacia un objetivo.
 *
 * Es `role="progressbar"` con sus valores ARIA: quien no ve la barra recibe
 * el mismo dato. El color no es la única señal (el texto acompaña siempre).
 */
export function Progress({ value, label, isExceeded = false, className }: ProgressProps) {
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
        className={cn(
          'h-full rounded-full transition-[width]',
          isExceeded ? 'bg-warning' : 'bg-primary',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
