import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { LoadFailure, Skeleton } from '@/shared/components/feedback'
import { WIDE_TAP_AREA } from '@/shared/constants'
import { cn } from '@/shared/lib/utils'

interface AnalyticsSectionProps {
  readonly title: string
  readonly Icon: LucideIcon
  /** Ruta del dominio: desde una cifra se llega a lo que la produjo. */
  readonly to: string
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage: string | null
  readonly onRetry: () => void
  readonly children: ReactNode
}

/**
 * Un dominio dentro de Analytics: título, cifras y gráfica.
 *
 * Centraliza los estados de carga y de error para que cada dominio se ocupe
 * sólo de lo suyo. El estado «aún no hay bastante» lo decide cada dominio,
 * porque el umbral y las palabras dependen de lo que se esté midiendo.
 */
export function AnalyticsSection({
  title,
  Icon,
  to,
  isPending,
  isError,
  errorMessage,
  onRetry,
  children,
}: AnalyticsSectionProps) {
  const headingId = `analytics-${to.replace(/\W/g, '-')}`

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2
          id={headingId}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary"
        >
          <Icon className="h-4 w-4" aria-hidden />
          {title}
        </h2>
        {/* Medía 16 px de alto, lo que da la línea de un `text-xs`. El área
            pulsable sube a 44 sin engordar la fila del título. */}
        <Link
          to={to}
          className={cn(
            WIDE_TAP_AREA,
            'inline-flex items-center gap-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          Ver {title.toLowerCase()}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {isPending ? (
        <div role="status" aria-label={`Cargando ${title.toLowerCase()}`} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-56" />
        </div>
      ) : isError ? (
        <LoadFailure
          message={errorMessage ?? 'Vuelve a intentarlo en un momento.'}
          onRetry={onRetry}
        />
      ) : (
        children
      )}
    </section>
  )
}
