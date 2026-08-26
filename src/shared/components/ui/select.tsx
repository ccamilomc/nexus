import { ChevronDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * Desplegable sobre el `<select>` nativo.
 *
 * Nativo a propósito: en móvil abre el selector del sistema (accesible y
 * familiar) y evita sumar una dependencia sólo para esto.
 */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          // Como el resto de controles: 44 px en el móvil, 40 desde `sm`.
          // 16 px en el móvil para que iPhone no haga zoom al enfocar: ver `input.tsx`.
          'flex h-11 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-9 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive sm:h-10 sm:text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  ),
)
Select.displayName = 'Select'

export { Select }
