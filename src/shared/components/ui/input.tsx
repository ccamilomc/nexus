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
        'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive sm:h-10',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
