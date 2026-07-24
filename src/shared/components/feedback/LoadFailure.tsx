import { TriangleAlert } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'

import { EmptyState } from './EmptyState'

interface LoadFailureProps {
  /** Mensaje humano del error (`AppError.message`), nunca el técnico. */
  readonly message: string
  readonly onRetry: () => void
}

/**
 * Estado de error de una pantalla, con salida: el usuario siempre puede
 * reintentar sin recargar la aplicación (ver docs/11-ux-ui-y-diseno.md).
 */
export function LoadFailure({ message, onRetry }: LoadFailureProps) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title="No pudimos cargar esta información"
      description={message}
      action={
        <Button type="button" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      }
    />
  )
}
