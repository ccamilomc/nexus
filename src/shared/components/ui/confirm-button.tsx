import { useState } from 'react'

import { Button, type ButtonProps } from '@/shared/components/ui/button'

interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  readonly label: string
  /** Texto de la segunda pulsación, la que ejecuta la acción. */
  readonly confirmLabel: string
  readonly onConfirm: () => void
}

/**
 * Botón para acciones destructivas: pide confirmación en dos pasos.
 *
 * Se mantiene el mismo elemento entre ambos pasos para no perder el foco del
 * teclado, y aparece «Cancelar» como salida evidente.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  variant = 'ghost',
  ...props
}: ConfirmButtonProps) {
  const [isArmed, setIsArmed] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={isArmed ? 'destructive' : variant}
        onClick={() => {
          if (!isArmed) {
            setIsArmed(true)
            return
          }
          setIsArmed(false)
          onConfirm()
        }}
        {...props}
      >
        {isArmed ? confirmLabel : label}
      </Button>

      {isArmed ? (
        <Button type="button" variant="ghost" size={props.size} onClick={() => setIsArmed(false)}>
          Cancelar
        </Button>
      ) : null}
    </div>
  )
}
