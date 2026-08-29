import type { UseFormRegisterReturn } from 'react-hook-form'

import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { formatCop } from '@/shared/utils'

import type { DebtWithBalance } from '../types/finance.types'

interface TransactionDebtFieldProps {
  /** Las del sentido que toca; el formulario ya las filtró. */
  readonly debts: readonly DebtWithBalance[]
  readonly isIncome: boolean
  readonly registration: UseFormRegisterReturn
}

/**
 * A qué deuda abona este movimiento, si abona alguna.
 *
 * **No aparece si no hay deudas del sentido que toca**: pagar lo que debes es un
 * gasto y cobrar lo que te deben es un ingreso, así que ofrecer las del otro
 * lado dejaría abonar una deuda con dinero que entró. Sin ninguna viva, el campo
 * no existe y el formulario no crece por nada.
 */
export function TransactionDebtField({ debts, isIncome, registration }: TransactionDebtFieldProps) {
  if (debts.length === 0) return null

  return (
    <div>
      <Label htmlFor="finance-debt">
        {isIncome ? '¿Te abonan una deuda?' : '¿Abona una deuda?'}
      </Label>
      <Select id="finance-debt" {...registration}>
        <option value="">No</option>
        {debts.map(({ debt, balance }) => (
          <option key={debt.id} value={debt.id}>
            {debt.counterpart} · faltan {formatCop(balance.remaining)}
          </option>
        ))}
      </Select>
    </div>
  )
}
