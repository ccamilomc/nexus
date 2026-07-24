import { cn } from '@/shared/lib/utils'

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

/** Lista de bloques de carga, para pantallas que muestran listas o tarjetas. */
export function SkeletonList({ label, rows = 4, rowClassName = 'h-16' }: SkeletonListProps) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={rowClassName} />
      ))}
    </div>
  )
}
