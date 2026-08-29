import { Button } from '@/shared/components/ui/button'

import type { FinanceTransactionWithNames } from '../types/finance.types'

type Kind = FinanceTransactionWithNames['kind']

interface TransactionKindPickerProps {
  readonly options: readonly { readonly value: Kind; readonly label: string }[]
  readonly value: Kind
  /** Se está corrigiendo uno ya apuntado, y la pregunta cambia. */
  readonly isEditing: boolean
  readonly onSelect: (kind: Kind) => void
}

/**
 * Gasto, ingreso o traspaso.
 *
 * **Botones y no un desplegable**: son tres opciones, se eligen en cada
 * movimiento y con el teléfono en la mano un toque gana a dos.
 */
export function TransactionKindPicker({
  options,
  value,
  isEditing,
  onSelect,
}: TransactionKindPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">
        {isEditing ? 'Corrige el movimiento' : '¿Qué apuntas?'}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value: kind, label }) => (
          <Button
            key={kind}
            type="button"
            variant={value === kind ? 'default' : 'outline'}
            className="min-w-24 flex-1"
            onClick={() => onSelect(kind)}
          >
            {label}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
