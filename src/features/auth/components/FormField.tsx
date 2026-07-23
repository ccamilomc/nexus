import { cloneElement, isValidElement, type PropsWithChildren, type ReactElement } from 'react'

import { Label } from '@/shared/components/ui/label'

interface FormFieldProps extends PropsWithChildren {
  readonly id: string
  readonly label: string
  readonly error?: string | undefined
}

/** Campo de formulario: etiqueta + control + mensaje de error accesible. */
export function FormField({ id, label, error, children }: FormFieldProps) {
  const errorId = `${id}-error`

  // Enlaza el control con su mensaje de error para lectores de pantalla.
  const control =
    error && isValidElement(children)
      ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': errorId,
        })
      : children

  return (
    <div className="space-y-1.5">
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
