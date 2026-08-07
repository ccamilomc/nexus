import { Plus } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { FormAlert } from '@/shared/components/feedback'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'

interface AccountFieldProps {
  readonly id: string
  readonly label: string
  readonly accounts: readonly { readonly id: string; readonly name: string }[]
  readonly registration: UseFormRegisterReturn
  readonly error?: string | undefined
}

/**
 * El selector de cuenta, con la salida a crear una más.
 *
 * **Sin el atajo, quien sólo tiene «Efectivo» ve un desplegable con una única
 * opción y ninguna pista de qué hacer.** La lista está bien —esa es su cuenta—,
 * pero el camino para añadir otra estaba en otra pestaña y había que
 * adivinarlo. Vive aquí, en un componente, porque lo necesitan los dos
 * formularios que piden cuenta: el de movimientos y el de pagos fijos.
 */
export function AccountField({ id, label, accounts, registration, error }: AccountFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} {...registration}>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </Select>

      <Link
        to={ROUTES.financeAccounts}
        className="mt-1.5 inline-flex items-center gap-1 rounded text-xs text-muted-foreground transition-colors duration-fast ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="h-3 w-3" aria-hidden />
        Añadir otra cuenta
      </Link>

      {error ? <FormAlert>{error}</FormAlert> : null}
    </div>
  )
}
