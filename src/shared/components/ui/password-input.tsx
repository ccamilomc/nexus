import { Eye, EyeOff } from 'lucide-react'
import * as React from 'react'

import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>

/**
 * Campo de contraseña con botón para mostrar/ocultar lo escrito. Reutiliza el
 * primitivo Input para no duplicar estilos.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => {
            setVisible((current) => !current)
          }}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
