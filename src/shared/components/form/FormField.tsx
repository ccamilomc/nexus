import { cloneElement, isValidElement, type PropsWithChildren, type ReactElement } from 'react'

import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'

interface FormFieldProps extends PropsWithChildren {
  readonly id: string
  readonly label: string
  readonly error?: string | undefined
  readonly className?: string
}

/** Campo de formulario: etiqueta + control + mensaje de error accesible. */
export function FormField({ id, label, error, className, children }: FormFieldProps) {
  const errorId = `${id}-error`

  // Enlaza el control con su mensaje de error para lectores de pantalla.
  const control =
    error && isValidElement(children)
      ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': errorId,
        })
      : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
