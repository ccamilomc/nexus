import type { PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/utils'

interface FormAlertProps extends PropsWithChildren {
  readonly variant?: 'error' | 'success' | 'warning'
}

/**
 * El fondo va al 5 %, **no al 10**, y es una cuestión de contraste medido.
 *
 * El texto se tiñe del mismo color que el fondo, así que cada punto de tinte
 * sube la luminancia del fondo y come contraste. Con el 10 %, sobre el tema
 * claro, `success` se quedaba en **4,44** y `warning` en **4,27**, los dos por
 * debajo del 4,5 que exige la WCAG AA —y `success` llevaba así desde antes de
 * que existiera `warning`—. Al 5 % pasan los tres.
 *
 * Los tokens no tienen la culpa: sobre el blanco de la tarjeta dan 5,07 y 4,85.
 * Es el tinte lo que los hundía, así que **no subir esto sin volver a medir**.
 */
const VARIANTS = {
  error: 'border-destructive/30 bg-destructive/5 text-destructive',
  success: 'border-success/30 bg-success/5 text-success',
  // Ámbar: lo que se puede guardar igual, pero conviene mirar antes.
  warning: 'border-warning/30 bg-warning/5 text-warning',
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
