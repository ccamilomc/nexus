import { Skeleton } from '@/shared/components/feedback'

interface SummaryLinesProps {
  readonly isPending: boolean
  readonly isEmpty: boolean
  /** Qué decir cuando el dominio aún no tiene nada registrado. */
  readonly emptyLabel: string
  readonly lines: readonly string[]
  /** Qué se está cargando; lo anuncian los lectores de pantalla. */
  readonly loadingLabel: string
}

/**
 * Contenido de una tarjeta del dashboard.
 *
 * Todos los dominios resumen igual —cargando, vacío o unas frases—, así que la
 * forma vive aquí una sola vez y cada módulo sólo aporta el texto.
 */
export function SummaryLines({
  isPending,
  isEmpty,
  emptyLabel,
  lines,
  loadingLabel,
}: SummaryLinesProps) {
  if (isPending) {
    return (
      <div className="space-y-1.5" role="status" aria-label={loadingLabel}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  if (isEmpty) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>

  return (
    <ul className="space-y-0.5">
      {lines.map((line) => (
        <li key={line} className="text-sm tabular-nums">
          {line}
        </li>
      ))}
    </ul>
  )
}
