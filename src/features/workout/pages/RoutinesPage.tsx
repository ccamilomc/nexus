import { ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { workoutRoutinePath } from '@/app/router/routes'
import { useNow } from '@/core/time'
import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { RoutineForm } from '../components/RoutineForm'
import { RoutineList } from '../components/RoutineList'
import { useRoutineSummaries } from '../hooks/use-routines'

/** Lista de rutinas del usuario y creación de rutinas nuevas. */
export function RoutinesPage() {
  const { data, isPending, isError, error, refetch } = useRoutineSummaries()
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  const now = useNow()

  if (isPending) return <SkeletonList label="Cargando tus rutinas" rows={3} rowClassName="h-16" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'rutina' : 'rutinas'}
        </p>
        {isCreating ? null : (
          <Button type="button" size="sm" onClick={() => setIsCreating(true)}>
            <Plus aria-hidden />
            Crear rutina
          </Button>
        )}
      </div>

      {isCreating ? (
        <RoutineForm
          // Al crearla, se abre directamente para empezar a darle forma.
          onCreated={(routine) => navigate(workoutRoutinePath(routine.id))}
          onCancel={() => setIsCreating(false)}
        />
      ) : null}

      {data.length === 0 ? (
        isCreating ? null : (
          <EmptyState
            icon={ListChecks}
            title="Aún no tienes rutinas"
            description="Crea una rutina para planificar tus días de entrenamiento."
          />
        )
      ) : (
        <RoutineList summaries={data} now={now} />
      )}
    </div>
  )
}
