import { Plus, X } from 'lucide-react'
import type { Control, UseFormRegister } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'

import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { MoneyField } from '@/shared/components/ui/money-input'
import { Select } from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import type { TransactionValues } from '../schemas/finance.schema'
import type { FinanceCategory } from '../types/finance.types'

interface TransactionSplitsProps {
  readonly control: Control<TransactionValues>
  readonly register: UseFormRegister<TransactionValues>
  /** Las del tipo que toca. Un traspaso no llega aquí. */
  readonly categories: readonly FinanceCategory[]
  /** El total del movimiento, para decir cuánto queda sin repartir. */
  readonly amount: number
  /** Cómo se llama la categoría que se queda con el resto. */
  readonly restName: string
  readonly splits: TransactionValues['splits']
  readonly error: string | undefined
}

/**
 * Repartir un gasto entre varias categorías.
 *
 * Una compra del supermercado no es sólo mercado: hay jabón, hay pilas. Sin esto
 * había que elegir una categoría —y mentir— o partir el pago en dos movimientos
 * que nunca existieron, con lo que el extracto del banco deja de cuadrar.
 *
 * **Sólo se teclea lo que se recorta.** Lo que queda se calcula y se enseña
 * —«Mercado se queda con $124.800»—, así que el reparto no puede descuadrar: no
 * hay forma de escribir unas partes que no sumen el total.
 *
 * Va plegado mientras no haya nada repartido, que es casi siempre: un gasto
 * normal no debería pagar el precio de una pantalla más llena.
 */
export function TransactionSplits({
  control,
  register,
  categories,
  amount,
  restName,
  splits,
  error,
}: TransactionSplitsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'splits' })

  const shared = splits.reduce((sum, split) => sum + (split.amount || 0), 0)
  const rest = (amount || 0) - shared
  // Las ya usadas no se vuelven a ofrecer: dos partes de la misma categoría son
  // dos formas de decir lo mismo, y la base las rechaza.
  const used = new Set(splits.map((split) => split.categoryId))

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor={`split-category-${index}`}>Parte {index + 1}</Label>
            <Select id={`split-category-${index}`} {...register(`splits.${index}.categoryId`)}>
              <option value="">Elige una</option>
              {categories
                .filter(
                  (category) => !used.has(category.id) || splits[index]?.categoryId === category.id,
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </Select>
          </div>

          <div className="w-32 shrink-0">
            <Label htmlFor={`split-amount-${index}`}>Cuánto</Label>
            <MoneyField
              control={control}
              name={`splits.${index}.amount`}
              id={`split-amount-${index}`}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Quitar la parte ${index + 1}`}
            className="shrink-0 text-muted-foreground"
            onClick={() => remove(index)}
          >
            <X aria-hidden />
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => append({ categoryId: '', amount: Number.NaN })}
        >
          <Plus aria-hidden />
          {fields.length === 0 ? 'Repartir en varias categorías' : 'Añadir otra parte'}
        </Button>

        {/* El resto se dice mientras se teclea, no al guardar: es la cifra que
            no hay que escribir, y verla es lo que da confianza en el reparto. */}
        {fields.length > 0 ? (
          <p
            className={cn(
              'text-xs tabular-nums',
              rest < 0 ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {rest < 0
              ? `Te pasaste ${formatCop(Math.abs(rest))} del total.`
              : `${restName} se queda con ${formatCop(rest)}.`}
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
