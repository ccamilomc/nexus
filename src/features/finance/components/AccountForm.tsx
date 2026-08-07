import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'

import { ACCOUNT_KIND_LABELS } from '../constants/finance.constants'
import { useCreateAccount } from '../hooks/use-finance'
import { accountSchema, type AccountValues } from '../schemas/finance.schema'

interface AccountFormProps {
  readonly onCreated?: () => void
}

/**
 * Crear una cuenta: un cajón con nombre, no una cuenta conectada a ningún banco.
 *
 * El saldo inicial admite negativos porque una tarjeta de crédito empieza
 * debiendo, y fingir que empieza en cero descuadraría todo desde el primer día.
 */
export function AccountForm({ onCreated }: AccountFormProps) {
  const create = useCreateAccount()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { kind: 'cash', initialBalance: 0 },
  })

  const onSubmit = handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: () => {
        reset({ kind: 'cash', initialBalance: 0, name: '' })
        onCreated?.()
      },
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="account-name">Nombre</Label>
        <Input
          id="account-name"
          placeholder="Efectivo, Nequi, Bancolombia…"
          {...register('name')}
        />
        {errors.name ? <FormAlert>{errors.name.message}</FormAlert> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="account-kind">Tipo</Label>
          <Select id="account-kind" {...register('kind')}>
            {Object.entries(ACCOUNT_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="account-balance">¿Cuánto hay ahora?</Label>
          <Input
            id="account-balance"
            type="number"
            inputMode="numeric"
            step={1}
            placeholder="0"
            {...register('initialBalance', { valueAsNumber: true })}
          />
          {errors.initialBalance ? <FormAlert>{errors.initialBalance.message}</FormAlert> : null}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting || create.isPending}>
        <Plus aria-hidden />
        {create.isPending ? 'Creando…' : 'Crear cuenta'}
      </Button>

      {create.error ? <FormAlert>{create.error.message}</FormAlert> : null}
    </form>
  )
}
