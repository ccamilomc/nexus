import { ArrowLeft, ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { EmptyState, FormAlert, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'

import { AddDayForm } from '../components/AddDayForm'
import { RoutineDayCard } from '../components/RoutineDayCard'
import { useRoutineDetail } from '../hooks/use-routine-detail'
import { useDeleteRoutine } from '../hooks/use-routines'

/** Detalle de una rutina: sus días, sus ejercicios prescritos y su edición. */
export function RoutineDetailPage() {
  // La ruta siempre aporta el id; el valor por defecto sólo satisface a TS.
  const { routineId = '' } = useParams()
  const { data, isPending, isError, error, refetch } = useRoutineDetail(routineId)
  const deleteRoutine = useDeleteRoutine()
  const navigate = useNavigate()
  const [isAddingDay, setIsAddingDay] = useState(false)

  if (isPending) return <SkeletonList label="Cargando la rutina" rows={3} rowClassName="h-24" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  if (!data) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No encontramos la rutina"
        description="Puede que se haya eliminado."
        action={
          <Button variant="outline" onClick={() => navigate(ROUTES.workoutRoutines)}>
            Volver a rutinas
          </Button>
        }
      />
    )
  }

  const { routine, days } = data

  return (
    <div className="space-y-4">
      <Link
        to={ROUTES.workoutRoutines}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Rutinas
      </Link>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">{routine.name}</h2>
        {routine.goal ? <p className="text-sm text-muted-foreground">{routine.goal}</p> : null}
      </div>

      {days.length > 0 ? (
        <ul className="space-y-3">
          {days.map((dayDetail) => (
            <li key={dayDetail.day.id}>
              <RoutineDayCard routineId={routine.id} detail={dayDetail} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Añade un día (por ejemplo «Empuje») para empezar a colocar ejercicios.
        </p>
      )}

      {isAddingDay ? (
        <Card>
          <CardContent className="p-4">
            <AddDayForm
              routineId={routine.id}
              onAdded={() => setIsAddingDay(false)}
              onCancel={() => setIsAddingDay(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsAddingDay(true)}
        >
          <Plus aria-hidden />
          Añadir día
        </Button>
      )}

      {deleteRoutine.isError ? <FormAlert>{deleteRoutine.error.message}</FormAlert> : null}

      <div className="flex justify-center pt-2">
        <ConfirmButton
          label="Borrar rutina"
          confirmLabel="Sí, borrar"
          size="sm"
          disabled={deleteRoutine.isPending}
          onConfirm={() =>
            deleteRoutine.mutate(routine.id, {
              onSuccess: () => navigate(ROUTES.workoutRoutines),
            })
          }
          className="text-muted-foreground"
        />
      </div>
    </div>
  )
}
