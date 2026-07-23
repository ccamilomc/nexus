import { RotateCcw, TriangleAlert } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { createAppError, isAppError } from '@/core/error/app-error'
import { logger } from '@/core/logger'
import { Button } from '@/shared/components/ui/button'

/**
 * Frontera de errores de la aplicación.
 *
 * Se apoya en `react-error-boundary` porque React sólo ofrece esta capacidad
 * mediante componentes de clase, prohibidos por la constitución del proyecto
 * (justificación en docs/10-stack-tecnologico.md).
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = isAppError(error) ? error.message : createAppError('unknown').message

  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">Se ha producido un problema</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button onClick={resetErrorBoundary}>
        <RotateCcw aria-hidden />
        Reintentar
      </Button>
    </div>
  )
}

export function AppErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        logger.error('Error capturado por el ErrorBoundary', {
          detail: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
