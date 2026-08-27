import { Check, Plus, X } from 'lucide-react'
import { useId, useState } from 'react'

import { FormAlert, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
import { matchesQuery } from '@/shared/utils'

import { useFoods } from '../hooks/use-nutrition'
import type { Food } from '../types/nutrition.types'
import { formatCalories, formatServing } from '../utils/format'
import { FoodForm } from './FoodForm'
import { FoodMacroLine } from './FoodMacroLine'

interface FoodPickerProps {
  readonly onSelect: (foods: readonly Food[]) => void
  readonly onClose: () => void
}

/**
 * Elegir lo que se va a registrar (o crear un alimento nuevo).
 *
 * **Se marcan varios y se pasa una vez.** Una comida son varias cosas, y de una
 * en una había que repetir el ciclo entero —buscar, elegir, cantidad, guardar—
 * por cada plato; un almuerzo de cuatro eran cuatro vueltas.
 *
 * Lo marcado **sobrevive a la búsqueda**: se busca «pollo», se marca, se borra
 * el texto y se busca «arroz», y el pollo sigue elegido. Si el filtro vaciara la
 * selección habría que volver a empezar en cada plato, que es justo lo que se
 * quiere evitar.
 */
export function FoodPicker({ onSelect, onClose }: FoodPickerProps) {
  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [chosen, setChosen] = useState<readonly Food[]>([])
  const { data, isPending, isError, error } = useFoods()
  const titleId = useId()

  const available = (data ?? []).filter((food) => matchesQuery(food.name, query))
  const isChosen = (food: Food) => chosen.some(({ id }) => id === food.id)

  const toggle = (food: Food) =>
    setChosen((current) =>
      current.some(({ id }) => id === food.id)
        ? current.filter(({ id }) => id !== food.id)
        : [...current, food],
    )

  // Al crear desde aquí, el alimento nuevo pasa directo al paso de cantidad:
  // estás comiendo eso ahora mismo.
  if (isCreating) {
    return (
      <FoodForm
        initialName={query}
        onSaved={(food) => onSelect([food])}
        onCancel={() => setIsCreating(false)}
      />
    )
  }

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p id={titleId} className="font-medium">
            Añadir alimentos
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar el selector de alimentos"
            onClick={onClose}
          >
            <X aria-hidden />
          </Button>
        </div>

        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar alimento"
          aria-label="Buscar alimento"
          autoFocus
        />

        {isPending ? (
          <SkeletonList label="Cargando alimentos" rows={3} rowClassName="h-14" />
        ) : isError ? (
          <FormAlert>{error.message}</FormAlert>
        ) : available.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ningún alimento coincide con tu búsqueda.
          </p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {available.map((food) => {
              const selected = isChosen(food)

              return (
                <li key={food.id}>
                  <button
                    type="button"
                    // `aria-pressed` y no `checked`: es un botón que queda
                    // hundido, y así se anuncia como «marcado» sin fingir que
                    // hay una casilla que no existe.
                    aria-pressed={selected}
                    onClick={() => toggle(food)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-accent',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input',
                      )}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{food.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatServing(food)} · {formatCalories(food.calories)}
                        {food.is_custom ? ' · Personal' : ''}
                      </span>
                      <FoodMacroLine food={food} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={chosen.length === 0} onClick={() => onSelect(chosen)}>
            {chosen.length === 0
              ? 'Elige alimentos'
              : chosen.length === 1
                ? 'Seguir con 1 alimento'
                : `Seguir con ${chosen.length} alimentos`}
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsCreating(true)}>
            <Plus aria-hidden />
            Crear alimento nuevo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
