import { Plus, X } from 'lucide-react'
import { useId, useState } from 'react'

import { FormAlert, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useExercises } from '../hooks/use-exercises'
import type { Exercise } from '../types/workout.types'
import { matchesQuery } from '../utils/search'
import { ExerciseForm } from './ExerciseForm'
import { ExerciseList } from './ExerciseList'

interface ExercisePickerProps {
  /** Ejercicios que ya están en el entrenamiento: no se ofrecen otra vez. */
  readonly excludedIds: readonly string[]
  readonly onSelect: (exercise: Exercise) => void
  readonly onClose: () => void
}

/** Panel para elegir el ejercicio que se va a entrenar (o crear uno nuevo). */
export function ExercisePicker({ excludedIds, onSelect, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { data, isPending, isError, error } = useExercises()
  const titleId = useId()

  const available = (data ?? []).filter(
    (exercise) => !excludedIds.includes(exercise.id) && matchesQuery(exercise.name, query),
  )

  return (
    <Card aria-labelledby={titleId} role="region">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p id={titleId} className="font-medium">
            {isCreating ? 'Crear ejercicio' : 'Añadir ejercicio'}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar el selector de ejercicios"
            onClick={onClose}
          >
            <X aria-hidden />
          </Button>
        </div>

        {isCreating ? (
          // Al crear desde aquí, el nuevo ejercicio se añade directo a la sesión.
          <ExerciseForm
            initialName={query}
            onCreated={onSelect}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          <>
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ejercicio"
              aria-label="Buscar ejercicio"
              autoFocus
            />

            {isPending ? (
              <SkeletonList label="Cargando ejercicios" rows={3} rowClassName="h-14" />
            ) : isError ? (
              <FormAlert>{error.message}</FormAlert>
            ) : available.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {query
                  ? 'Ningún ejercicio coincide con tu búsqueda.'
                  : 'Ya añadiste todo el catálogo.'}
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <ExerciseList exercises={available} onSelect={onSelect} />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <Plus aria-hidden />
              Crear ejercicio nuevo
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
