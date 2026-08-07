import { Skeleton } from '@/shared/components/feedback'
import { Progress } from '@/shared/components/ui/progress'
import type { SummaryProgress } from '@/shared/types'

interface SummaryLinesProps {
  readonly isPending: boolean
  readonly isEmpty: boolean
  /** Qué decir cuando el dominio aún no tiene nada registrado. */
  readonly emptyLabel: string
  readonly lines: readonly string[]
  /** Avances con objetivo. Vacío en los dominios que no tienen ninguno. */
  readonly progress?: readonly SummaryProgress[]
  /** Qué se está cargando; lo anuncian los lectores de pantalla. */
  readonly loadingLabel: string
}

/**
 * Contenido de una tarjeta del dashboard.
 *
 * Todos los dominios resumen igual —cargando, vacío, unos avances y unas
 * frases—, así que la forma vive aquí una sola vez y cada módulo sólo aporta lo
 * suyo.
 *
 * **Lo que tiene meta se dibuja; lo que no, se dice.** «0 de 3 hechos» en texto
 * obliga a leer y comparar dos números; una barra se entiende sin leerla. Pero
 * la barra sólo aparece cuando el dominio publica un objetivo de verdad: sin
 * meta habría que inventarse dónde está el 100 %.
 */
export function SummaryLines({
  isPending,
  isEmpty,
  emptyLabel,
  lines,
  progress = [],
  loadingLabel,
}: SummaryLinesProps) {
  if (isPending) {
    return (
      <div className="space-y-2" role="status" aria-label={loadingLabel}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
      </div>
    )
  }

  if (isEmpty) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>

  return (
    <div className="space-y-3">
      {progress.map((item) => (
        <ProgressRow key={item.label} item={item} />
      ))}

      {lines.length > 0 ? (
        <ul className="space-y-0.5">
          {lines.map((line) => (
            <li key={line} className="text-sm tabular-nums text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Un avance: su nombre, la cifra y la barra. */
function ProgressRow({ item }: { readonly item: SummaryProgress }) {
  const percent = item.target > 0 ? (item.value / item.target) * 100 : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
        <span className="text-sm font-semibold tabular-nums">{item.display}</span>
      </div>
      {/* La cifra va siempre al lado: la barra acompaña, no sustituye. Quien no
          distingue el color —o no ve la barra— tiene el dato igual. */}
      <Progress
        value={percent}
        label={`${item.label}: ${item.display}`}
        isExceeded={item.value > item.target}
      />
    </div>
  )
}
