import { formatCop } from '@/shared/utils'

import { useRemoveBudget, useSetBudget } from '../hooks/use-finance'
import type { FinanceBudget } from '../types/finance.types'
import { CapField } from './CapField'

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
 * Por lo mismo, el presupuesto del mes **no** vive aquí: no es de ninguna
 * categoría. Se pone en Finanzas, donde se lee.
 */
export function BudgetField({ categoryId, categoryName, budget }: BudgetFieldProps) {
  const save = useSetBudget()
  const remove = useRemoveBudget()

  return (
    <div className="flex shrink-0 items-center gap-1">
      {budget ? (
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatCop(budget.amount)}/mes
        </span>
      ) : null}

      <CapField
        label={`Tope mensual de ${categoryName}`}
        current={budget?.amount ?? null}
        setLabel="Poner tope"
        isBusy={save.isPending || remove.isPending}
        failure={(save.error ?? remove.error)?.message ?? null}
        onSave={(amount) => save.mutateAsync({ categoryId, amount })}
        onRemove={budget ? () => remove.mutateAsync(budget.id) : null}
      />
    </div>
  )
}
