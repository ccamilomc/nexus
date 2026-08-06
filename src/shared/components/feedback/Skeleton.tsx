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
 * El texto se limita a lo comprobado. Se probó a devolver la señal con la
 * pantalla abierta y **las consultas pausadas no reanudaron solas**; recargar sí
 * las recupera. Así que se pide reintentar en vez de prometer una recuperación
 * automática que no se ha podido demostrar. Tampoco promete guardar ni
 * sincronizar: la cola offline llega en el Sprint 14, donde toca resolver
 * también esa reanudación.
 */
export function SkeletonList({ label, rows = 4, rowClassName = 'h-16' }: SkeletonListProps) {
  const isOnline = useIsOnline()

  if (!isOnline) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Sin conexión"
        description="Vuelve a intentarlo cuando tengas señal."
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
