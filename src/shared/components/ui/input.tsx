import * as React from 'react'

import { cn } from '@/shared/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        // 44 px en el móvil, 40 a partir de `sm`: es la regla de objetivo táctil
        // del proyecto (docs/11) y el escritorio no la necesita.
        //
        // **16 px de texto en el móvil, y esto no es estético.** Safari en iPhone
        // hace zoom sobre cualquier campo cuya letra baje de 16 px al enfocarlo,
        // y después deja la página más ancha que la pantalla: el usuario acaba
        // arrastrándola de lado sin saber por qué. Con `text-base` no hay motivo
        // para ampliar y no amplía. Desde `sm` vuelve a 14, donde no aplica.
        // Misma regla en `select` y `textarea`.
        'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive sm:h-10 sm:text-sm',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
