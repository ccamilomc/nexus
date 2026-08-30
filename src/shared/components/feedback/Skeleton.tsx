import { WifiOff } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

// Directo al módulo, no al barrel de `shared/hooks`: por él también asoma
// `useSeriesQuery`, que arrastra `core/auth` y con él el cliente de Supabase,
// que valida las variables de entorno al cargarse. En CI no las hay, y el test
// de este componente moría antes de empezar (ver la memoria del proyecto).
import { useIsOnline } from '../../hooks/use-is-online'
import { EmptyState } from './EmptyState'

interface SkeletonProps {
  readonly className?: string
}

/** Bloque de carga: ocupa el sitio del contenido mientras llega. */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-muted', className)} />
}

interface SkeletonListProps {
  /** Qué se está cargando; lo anuncian los lectores de pantalla. */
  readonly label: string
  readonly rows?: number
  readonly rowClassName?: string
}

/**
 * Lista de bloques de carga, para pantallas que muestran listas o tarjetas.
 *
 * **Sin conexión no finge que algo viene en camino.** Cuando se cae la red,
 * TanStack Query no falla: *pausa* la consulta a la espera de señal. La consulta
 * se queda en `pending` para siempre, nunca hay error que mostrar, y la pantalla
 * se quedaba con los bloques latiendo indefinidamente sin explicar nada.
 *
 * Cubre el caso de **pantalla entera esperando datos**, que es el que pasa por
 * aquí. Los `<Skeleton>` sueltos dentro de una tarjeta ya pintada —el agua del
 * día, las dos frases de un resumen— siguen siendo marcadores en línea: llenar
 * el dashboard de seis avisos repetidos sería peor. De ésos se encarga el
 * `OfflineBanner` del cascarón, que lo dice una vez arriba.
 *
 * **Se recupera sola, y el texto ya lo dice.** Antes pedía reintentar, porque se
 * había medido que al volver la señal las consultas pausadas no reanudaban. Esa
 * medida estaba tomada con el navegador oculto: TanStack exige red **y** foco
 * para continuar lo pausado (`canContinue()` en su `retryer`), y un navegador
 * escondido nunca tiene lo segundo. Con la aplicación en pantalla —un teléfono
 * en la mano— reanuda sola en menos de un segundo. Atado en
 * `app/providers/query-defaults.test.ts`.
 *
 * Lo que sigue sin prometer es guardar ni sincronizar: de eso se encarga la cola
 * de mutaciones, que es otra cosa (ADR-0011).
 */
export function SkeletonList({ label, rows = 4, rowClassName = 'h-16' }: SkeletonListProps) {
  const isOnline = useIsOnline()

  if (!isOnline) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Sin conexión"
        description="Se carga sola en cuanto vuelva la señal."
      />
    )
  }

  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={rowClassName} />
      ))}
    </div>
  )
}
