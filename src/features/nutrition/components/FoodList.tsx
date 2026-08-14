import { Pencil } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'

import type { Food } from '../types/nutrition.types'
import { formatCalories, formatServing } from '../utils/format'
import { FoodMacroLine } from './FoodMacroLine'

interface FoodListProps {
  readonly foods: readonly Food[]
  /** Editar/borrar; sólo se ofrecen en los alimentos propios. */
  readonly onEdit?: (food: Food) => void
  readonly onDelete?: (food: Food) => void
}

/** Catálogo de alimentos con sus macros por porción. */
export function FoodList({ foods, onEdit, onDelete }: FoodListProps) {
  const hasActions = Boolean(onEdit || onDelete)

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {foods.map((food) => (
        <li key={food.id} className="min-w-0 rounded-lg border border-border bg-card p-3">
          <p className="truncate font-medium">{food.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatServing(food)} · {formatCalories(food.calories)}
            {food.brand ? ` · ${food.brand}` : ''}
            {food.is_custom ? ' · Personal' : ''}
          </p>
          <FoodMacroLine food={food} />

          {hasActions && food.is_custom ? (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {onEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar ${food.name}`}
                  onClick={() => onEdit(food)}
                >
                  <Pencil aria-hidden />
                  Editar
                </Button>
              ) : null}
              {onDelete ? (
                <ConfirmButton
                  label="Borrar"
                  confirmLabel="Sí, borrar"
                  size="sm"
                  aria-label={`Borrar ${food.name}`}
                  onConfirm={() => onDelete(food)}
                  className="text-muted-foreground"
                />
              ) : null}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
