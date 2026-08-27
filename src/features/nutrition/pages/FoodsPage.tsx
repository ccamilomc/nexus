import { Plus, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'

import { EmptyState, FormAlert, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { matchesQuery } from '@/shared/utils'

import { FoodForm } from '../components/FoodForm'
import { FoodList } from '../components/FoodList'
import { useDeleteFood, useFoods } from '../hooks/use-nutrition'
import type { Food } from '../types/nutrition.types'

/** Catálogo de alimentos y gestión de los propios. */
export function FoodsPage() {
  const { data, isPending, isError, error, refetch } = useFoods()
  const deleteFood = useDeleteFood()
  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<Food | null>(null)
  /** Del que se copia para crear uno propio; no se edita. */
  const [copying, setCopying] = useState<Food | null>(null)
  const [savedName, setSavedName] = useState<string | null>(null)

  if (isPending) return <SkeletonList label="Cargando alimentos" rows={6} rowClassName="h-16" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  const isFormOpen = isCreating || editing !== null || copying !== null
  const visible = data.filter((food) => matchesQuery(food.name, query))

  /** Todo lo que abre el formulario cierra los otros modos y limpia los avisos. */
  const closeOthers = () => {
    setIsCreating(false)
    setEditing(null)
    setCopying(null)
    setSavedName(null)
    deleteFood.reset()
  }

  const openCreate = () => {
    closeOthers()
    setIsCreating(true)
  }

  const openEdit = (food: Food) => {
    closeOthers()
    setEditing(food)
  }

  const openCopy = (food: Food) => {
    closeOthers()
    setCopying(food)
  }

  const onSaved = (food: Food) => {
    setIsCreating(false)
    setEditing(null)
    setCopying(null)
    setSavedName(food.name)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'alimento' : 'alimentos'}
        </p>
        {isFormOpen ? null : (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus aria-hidden />
            Crear alimento
          </Button>
        )}
      </div>

      {savedName ? (
        <FormAlert variant="success">Guardamos «{savedName}» en tu catálogo.</FormAlert>
      ) : null}

      {deleteFood.isError ? <FormAlert>{deleteFood.error.message}</FormAlert> : null}

      {editing ? (
        <FoodForm food={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />
      ) : copying ? (
        <FoodForm template={copying} onSaved={onSaved} onCancel={() => setCopying(null)} />
      ) : isCreating ? (
        <FoodForm onSaved={onSaved} onCancel={() => setIsCreating(false)} />
      ) : null}

      {isFormOpen ? null : (
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar alimento"
          aria-label="Buscar alimento"
        />
      )}

      {visible.length === 0 ? (
        isFormOpen ? null : (
          <EmptyState
            icon={UtensilsCrossed}
            title={query ? 'Ningún alimento coincide' : 'Aún no hay alimentos'}
            description={
              query
                ? 'Prueba con otro nombre o crea el alimento.'
                : 'Crea tu primer alimento para empezar tu catálogo.'
            }
          />
        )
      ) : (
        <FoodList
          foods={visible}
          onEdit={openEdit}
          onCopy={openCopy}
          onDelete={(food) => {
            setSavedName(null)
            deleteFood.mutate(food.id)
          }}
        />
      )}
    </div>
  )
}
