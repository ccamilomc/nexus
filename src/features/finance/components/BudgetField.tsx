import { Check, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { formatCop } from '@/shared/utils'

import { useRemoveBudget, useSetBudget } from '../hooks/use-finance'
import type { FinanceBudget } from '../types/finance.types'

interface BudgetFieldProps {
  readonly categoryId: string
  readonly categoryName: string
  readonly budget: FinanceBudget | undefined
}

/**
 * El tope mensual de una categoría, puesto desde su propia fila.
 *
 * **Vive en Categorías y no en una pestaña propia** porque un tope es una
 * propiedad de la categoría, no otra cosa que administrar: separarlos obligaría
 * a mantener dos listas de lo mismo en la cabeza.
 *
 * Se guarda con un botón y no al salir del campo: escribir «40» camino de
 * «400.000» y que se guarde solo sería peor que teclear de más.
 */
export function BudgetField({ categoryId, categoryName, budget }: BudgetFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const save = useSetBudget()
  const remove = useRemoveBudget()

  const isBusy = save.isPending || remove.isPending

  if (!isEditing) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        {budget ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatCop(budget.amount)}/mes
          </span>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            setDraft(budget ? String(budget.amount) : '')
            setIsEditing(true)
          }}
        >
          {budget ? 'Cambiar' : 'Poner tope'}
        </Button>
      </div>
    )
  }

  const amount = Number(draft)
  const canSave = draft !== '' && Number.isFinite(amount) && amount > 0
  const failure = save.error ?? remove.error

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      <Input
        type="number"
        inputMode="numeric"
        step={1}
        min={1}
        value={draft}
        autoFocus
        aria-label={`Tope mensual de ${categoryName}`}
        className="h-9 w-32"
        onChange={(event) => setDraft(event.target.value)}
      />

      <Button
        type="button"
        size="icon"
        disabled={!canSave || isBusy}
        aria-label="Guardar el tope"
        onClick={() =>
          save.mutate({ categoryId, amount }, { onSuccess: () => setIsEditing(false) })
        }
      >
        <Check aria-hidden />
      </Button>

      {/* Quitar el tope sólo aparece si lo hay: no se puede quitar lo que no
          está, y el botón sobraría en la mayoría de las filas. */}
      {budget ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isBusy}
          className="text-muted-foreground"
          onClick={() => remove.mutate(budget.id, { onSuccess: () => setIsEditing(false) })}
        >
          Quitar
        </Button>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Cancelar"
        className="text-muted-foreground"
        onClick={() => setIsEditing(false)}
      >
        <X aria-hidden />
      </Button>

      {/* Sin esto, un fallo al guardar sólo salía por consola y la fila se
          quedaba en modo edición sin decir por qué. Pasó de verdad. */}
      {failure ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {failure.message}
        </p>
      ) : null}
    </div>
  )
}
