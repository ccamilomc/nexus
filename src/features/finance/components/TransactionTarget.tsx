import type { UseFormRegisterReturn } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'

import type { FinanceAccount, FinanceCategory } from '../types/finance.types'
import { AccountField } from './AccountField'

interface TransactionTargetProps {
  readonly accounts: readonly FinanceAccount[]
  /** A dónde puede ir un traspaso: todas menos la de origen. */
  readonly destinations: readonly FinanceAccount[]
  /** Ya filtradas por el tipo de movimiento. */
  readonly categories: readonly FinanceCategory[]
  readonly isTransfer: boolean
  readonly accountRegistration: UseFormRegisterReturn
  readonly toAccountRegistration: UseFormRegisterReturn
  readonly categoryRegistration: UseFormRegisterReturn
  readonly accountError: string | undefined
  readonly toAccountError: string | undefined
}

/**
 * De dónde sale el dinero y a dónde va.
 *
 * **La segunda columna cambia con el tipo, y por eso van juntos.** Un traspaso
 * pide cuenta destino y no categoría —no se gasta en nada, cambia de cajón—; un
 * gasto o un ingreso piden categoría y no destino. Separarlos en dos
 * componentes obligaría a decidir dos veces lo mismo.
 */
export function TransactionTarget({
  accounts,
  destinations,
  categories,
  isTransfer,
  accountRegistration,
  toAccountRegistration,
  categoryRegistration,
  accountError,
  toAccountError,
}: TransactionTargetProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AccountField
        id="finance-account"
        label={isTransfer ? 'Desde' : 'Cuenta'}
        accounts={accounts}
        registration={accountRegistration}
        error={accountError}
      />

      {isTransfer ? (
        <div>
          <Label htmlFor="finance-to-account">Hacia</Label>
          <Select id="finance-to-account" {...toAccountRegistration}>
            <option value="">Elige una cuenta</option>
            {destinations.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
          {toAccountError ? <FormAlert>{toAccountError}</FormAlert> : null}
        </div>
      ) : (
        <div>
          <Label htmlFor="finance-category">Categoría</Label>
          <Select id="finance-category" {...categoryRegistration}>
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  )
}
