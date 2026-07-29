import { Plus, Repeat } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui/button'

import { HabitCard } from '../components/HabitCard'
import { HabitForm } from '../components/HabitForm'
import { useHabitsToday } from '../hooks/use-habits'

/** Los hábitos de hoy: marcarlos, ver la racha y crear nuevos. */
export function HabitsPage() {
  // Una única referencia temporal por render: si cambiara a media pantalla, la
  // consulta y el marcado mirarían días distintos.
  const today = useMemo(() => new Date(), [])
  const { data, isPending, isError, error, refetch } = useHabitsToday(today)
  const [isCreating, setIsCreating] = useState(false)

  const doneCount = data?.filter((entry) => entry.isDoneToday).length ?? 0

  return (
    <>
      <PageHeader title="Hábitos" description="Marca lo de hoy y mantén tu racha." />

      {isPending ? (
        <SkeletonList label="Cargando tus hábitos" rows={3} rowClassName="h-24" />
      ) : isError ? (
        <LoadFailure message={error.message} onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {data.length === 0
                ? 'Sin hábitos'
                : `${doneCount} de ${data.length} ${data.length === 1 ? 'hecho' : 'hechos'} hoy`}
            </p>
            {isCreating ? null : (
              <Button type="button" size="sm" onClick={() => setIsCreating(true)}>
                <Plus aria-hidden />
                Crear hábito
              </Button>
            )}
          </div>

          {isCreating ? (
            <HabitForm
              onCreated={() => setIsCreating(false)}
              onCancel={() => setIsCreating(false)}
            />
          ) : null}

          {data.length === 0 ? (
            isCreating ? null : (
              <EmptyState
                icon={Repeat}
                title="Aún no tienes hábitos"
                description="Crea uno y márcalo cada día: la racha se calcula sola."
              />
            )
          ) : (
            <ul className="space-y-3">
              {data.map((entry) => (
                <li key={entry.habit.id}>
                  <HabitCard date={today} entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
