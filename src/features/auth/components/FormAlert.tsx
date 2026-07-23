import type { PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/utils'

interface FormAlertProps extends PropsWithChildren {
  readonly variant?: 'error' | 'success'
}

/** Aviso de formulario (error o éxito) con mensaje humano. */
export function FormAlert({ variant = 'error', children }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        variant === 'success'
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      {children}
    </div>
  )
}
