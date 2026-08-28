import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { MoneyInput } from '@/shared/components/ui/money-input'
import { Select } from '@/shared/components/ui/select'
import { formatCop } from '@/shared/utils'

import { useFoods } from '../hooks/use-nutrition'
import type { Food, FoodPurchase } from '../types/nutrition.types'
import { formatServing } from '../utils/format'
import { priceChangePercent, pricePerServing } from '../utils/pricing'

interface FoodPurchaseFieldsProps {
  /**
   * Se llama con las compras **completas** cada vez que cambian.
   *
   * Las filas a medio escribir no salen: quien las use sólo tiene que
   * guardarlas y mandarlas. Para vaciar los campos tras guardar, remonta el
   * componente cambiándole la `key`; no hay API imperativa que mantener.
   */
  readonly onChange: (purchases: readonly FoodPurchase[]) => void
}

/** Una fila mientras se escribe: los campos numéricos viven como texto. */
interface PurchaseDraft {
  readonly key: number
  readonly foodId: string
  readonly quantity: string
  readonly paid: string
}

const EMPTY_DRAFT: Omit<PurchaseDraft, 'key'> = { foodId: '', quantity: '', paid: '' }

/** Sólo salen las filas que están completas y tienen sentido. */
function toPurchases(drafts: readonly PurchaseDraft[]): FoodPurchase[] {
  return drafts.flatMap((draft) => {
    const quantity = Number(draft.quantity)
    const paidCop = Number(draft.paid)

    if (!draft.foodId || !Number.isFinite(quantity) || !Number.isFinite(paidCop)) return []
    if (quantity <= 0 || paidCop <= 0) return []

    return [{ foodId: draft.foodId, quantity, paidCop }]
  })
}

/**
 * Qué compraste y por cuánto, para dejar los precios al día.
 *
 * **Pide el recibo, no el resultado.** El precio por porción es lo que Nexus
 * necesita, pero nadie lo lleva en la cabeza saliendo del supermercado: lo que
 * uno sabe es que trajo un kilo de pollo y pagó $18.000. Esa división es
 * exactamente la razón por la que los precios se quedaban viejos, y hacerla
 * aquí es todo el sentido de esta pieza.
 *
 * **Sólo se ofrecen los alimentos propios.** El catálogo de Nexus no lleva
 * precio y la RLS impide escribirlo, porque un precio es de quien lo paga: el
 * pollo no cuesta lo mismo en cada ciudad.
 */
export function FoodPurchaseFields({ onChange }: FoodPurchaseFieldsProps) {
  const { data: foods, isPending } = useFoods()
  const [drafts, setDrafts] = useState<readonly PurchaseDraft[]>([{ key: 0, ...EMPTY_DRAFT }])

  const own = (foods ?? []).filter((food) => food.is_custom)

  function update(next: readonly PurchaseDraft[]) {
    setDrafts(next)
    onChange(toPurchases(next))
  }

  if (isPending) return <p className="text-xs text-muted-foreground">Cargando tus alimentos…</p>

  if (own.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Todavía no tienes alimentos propios.{' '}
        <Link to={ROUTES.nutritionFoods} className="underline hover:text-foreground">
          Crea uno
        </Link>{' '}
        y podrás ponerle precio desde aquí. Los del catálogo de Nexus no llevan precio: el precio es
        tuyo, no de todos.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {drafts.map((draft, index) => (
        <PurchaseRow
          key={draft.key}
          draft={draft}
          foods={own}
          canRemove={drafts.length > 1}
          onChange={(next) => update(drafts.map((item, i) => (i === index ? next : item)))}
          onRemove={() => update(drafts.filter((_, i) => i !== index))}
        />
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() =>
          // La clave sale del mayor que haya, no de la longitud: quitando una
          // fila del medio, `length` repetiría una clave ya usada y React
          // reaprovecharía el campo equivocado.
          update([
            ...drafts,
            { key: Math.max(...drafts.map(({ key }) => key), -1) + 1, ...EMPTY_DRAFT },
          ])
        }
      >
        <Plus aria-hidden />
        Añadir otro alimento
      </Button>
    </div>
  )
}

interface PurchaseRowProps {
  readonly draft: PurchaseDraft
  readonly foods: readonly Food[]
  readonly canRemove: boolean
  readonly onChange: (draft: PurchaseDraft) => void
  readonly onRemove: () => void
}

function PurchaseRow({ draft, foods, canRemove, onChange, onRemove }: PurchaseRowProps) {
  const food = foods.find(({ id }) => id === draft.foodId)
  const nextCop = food
    ? pricePerServing(Number(draft.paid), Number(draft.quantity), food.serving_size)
    : null
  const change =
    nextCop === null ? null : priceChangePercent(food?.cost_per_serving ?? null, nextCop)

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor={`purchase-${draft.key}-food`}>Alimento</Label>
          <Select
            id={`purchase-${draft.key}-food`}
            value={draft.foodId}
            onChange={(event) => onChange({ ...draft, foodId: event.target.value })}
          >
            <option value="">Elige uno</option>
            {foods.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </div>

        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Quitar este alimento"
            className="shrink-0 text-muted-foreground"
            onClick={onRemove}
          >
            <X aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`purchase-${draft.key}-quantity`}>
            Cuánto {food ? `(${food.serving_unit})` : ''}
          </Label>
          <Input
            id={`purchase-${draft.key}-quantity`}
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="1000"
            value={draft.quantity}
            onChange={(event) => onChange({ ...draft, quantity: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor={`purchase-${draft.key}-paid`}>Lo que pagaste</Label>
          {/* El borrador guarda texto; el campo de dinero habla en cifras. */}
          <MoneyInput
            id={`purchase-${draft.key}-paid`}
            placeholder="18000"
            value={draft.paid === '' ? Number.NaN : Number(draft.paid)}
            onChange={(paid) =>
              onChange({ ...draft, paid: Number.isNaN(paid) ? '' : String(paid) })
            }
          />
        </div>
      </div>

      {/* El resultado se enseña antes de guardar: es la cuenta que el usuario
          no tiene que hacer, y verla es lo que da confianza para aceptarla. */}
      {food && nextCop !== null ? (
        <p className="text-xs text-muted-foreground">
          Queda en <span className="font-medium tabular-nums">{formatCop(nextCop)}</span> por
          porción de {formatServing(food)}
          {change !== null ? (
            <PriceChange percent={change} previous={food.cost_per_serving} />
          ) : null}
        </p>
      ) : null}
    </div>
  )
}

interface PriceChangeProps {
  readonly percent: number
  readonly previous: number | null
}

/**
 * Cuánto ha cambiado respecto a la última vez.
 *
 * **Va en gris, no en rojo ni en verde.** Que el pollo suba no es culpa de
 * nadie ni un fallo que corregir: es un dato, y las comparativas de Nexus van
 * en gris justamente para no convertir un dato en un reproche (docs/11).
 */
function PriceChange({ percent, previous }: PriceChangeProps) {
  if (percent === 0) return <>, igual que la última vez.</>

  return (
    <>
      , un {Math.abs(percent)} % {percent > 0 ? 'más' : 'menos'} que los {formatCop(previous ?? 0)}{' '}
      de antes.
    </>
  )
}
