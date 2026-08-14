import type { PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/utils'

interface FormAlertProps extends PropsWithChildren {
  readonly variant?: 'error' | 'success' | 'warning'
}

const VARIANTS = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  success: 'border-success/30 bg-success/10 text-success',
  // Ámbar: lo que se puede guardar igual, pero conviene mirar antes.
  warning: 'border-warning/30 bg-warning/10 text-warning',
} as const

/**
 * Aviso de formulario con mensaje humano.
 *
 * `warning` es para lo que **no impide guardar**: unos objetivos cuyos macros no
 * cuadran con las calorías se pueden fijar igual —quien los pone manda—, pero
 * decirlo en rojo daría a entender que están prohibidos.
 */
export function FormAlert({ variant = 'error', children }: FormAlertProps) {
  return (
    <div role="alert" className={cn('rounded-md border px-3 py-2 text-sm', VARIANTS[variant])}>
      {children}
    </div>
  )
}
