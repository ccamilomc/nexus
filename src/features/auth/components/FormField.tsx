import type { PropsWithChildren } from 'react'

import { Label } from '@/shared/components/ui/label'

interface FormFieldProps extends PropsWithChildren {
  readonly id: string
  readonly label: string
  readonly error?: string | undefined
}

/** Campo de formulario: etiqueta + control + mensaje de error accesible. */
export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
