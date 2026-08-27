import { useId } from 'react'

import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'

import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '../constants/workout.constants'
import type { Exercise } from '../types/workout.types'
import type { ExerciseFilters as Filters } from '../utils/filter-exercises'

interface ExerciseFiltersProps {
  readonly value: Filters
  readonly onChange: (filters: Filters) => void
  /** Cuántos quedan tras filtrar, para saber si merece la pena seguir bajando. */
  readonly resultCount: number
}

/**
 * Buscar y acotar el catálogo.
 *
 * Con trece ejercicios se recorría con el ojo; con setenta la pantalla pasa de
 * cinco mil píxeles y encontrar uno era bajar hasta verlo.
 *
 * **Se filtra por equipo además de por músculo** porque es la pregunta que se
 * hace quien entrena: no «qué ejercicios de pecho existen», sino «qué puedo
 * hacer hoy con lo que tengo delante».
 */
export function ExerciseFilters({ value, onChange, resultCount }: ExerciseFiltersProps) {
  const queryId = useId()
  const groupId = useId()
  const equipmentId = useId()

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <Label htmlFor={queryId}>Buscar</Label>
          <Input
            id={queryId}
            type="search"
            value={value.query}
            onChange={(event) => onChange({ ...value, query: event.target.value })}
            placeholder="Nombre del ejercicio"
          />
        </div>

        <div>
          <Label htmlFor={groupId}>Músculo</Label>
          <Select
            id={groupId}
            value={value.muscleGroup}
            onChange={(event) =>
              onChange({ ...value, muscleGroup: event.target.value as Exercise['muscle_group'] })
            }
          >
            <option value="">Todos</option>
            {Object.entries(MUSCLE_GROUP_LABELS).map(([group, label]) => (
              <option key={group} value={group}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor={equipmentId}>Equipo</Label>
          <Select
            id={equipmentId}
            value={value.equipment}
            onChange={(event) =>
              onChange({ ...value, equipment: event.target.value as Exercise['equipment'] })
            }
          >
            <option value="">Todos</option>
            {Object.entries(EQUIPMENT_LABELS).map(([equipment, label]) => (
              <option key={equipment} value={equipment}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {/* El recuento va aquí y no arriba del todo: es el resultado de lo que
            se acaba de elegir, y se lee en el sitio donde se eligió. */}
        <p className="self-end pb-2 text-sm text-muted-foreground" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'ejercicio' : 'ejercicios'}
        </p>
      </div>
    </div>
  )
}
