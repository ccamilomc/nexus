import { Plus, X } from 'lucide-react'
import { useId, useState } from 'react'

import { FormAlert, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { matchesQuery } from '@/shared/utils'

import { useFoods } from '../hooks/use-nutrition'
import type { Food } from '../types/nutrition.types'
import { formatCalories, formatServing } from '../utils/format'
import { FoodForm } from './FoodForm'
import { FoodMacroLine } from './FoodMacroLine'

interface FoodPickerProps {
  readonly onSelect: (food: Food) => void
  readonly onClose: () => void
}

/** Panel para elegir el alimento que se va a registrar (o crear uno nuevo). */
export function FoodPicker({ onSelect, onClose }: FoodPickerProps) {
  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { data, isPending, isError, error } = useFoods()
  const titleId = useId()

  const available = (data ?? []).filter((food) => matchesQuery(food.name, query))

  // Al crear desde aquí, el alimento nuevo pasa directo al paso de cantidad:
  // estás comiendo eso ahora mismo.
  if (isCreating) {
    return <FoodForm initialName={query} onSaved={onSelect} onCancel={() => setIsCreating(false)} />
  }

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p id={titleId} className="font-medium">
            Añadir alimento
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
          // Sube de 20 a 24 rem porque cada opción creció una línea al añadir
          // los macros: con la altura de antes se veían menos alimentos de un
          // vistazo que al principio, y eso es lo contrario de lo que se busca.
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {available.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() => onSelect(food)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="truncate font-medium">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatServing(food)} · {formatCalories(food.calories)}
                    {food.is_custom ? ' · Personal' : ''}
                  </p>
                  {/* Elegir qué comer es la decisión que se toma aquí, y con
                      sólo las calorías no se puede tomar: la pantalla dice que
                      faltan 120 g de proteína y luego no enseña la de nada. */}
                  <FoodMacroLine food={food} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsCreating(true)}
        >
          <Plus aria-hidden />
          Crear alimento nuevo
        </Button>
      </CardContent>
    </Card>
  )
}
