import { Plus, Repeat } from 'lucide-react'
import { useState } from 'react'

import { useToday } from '@/core/time'
import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui/button'
import { toDateKey } from '@/shared/utils'

import { ArchivedHabits } from '../components/ArchivedHabits'
import { HabitCard } from '../components/HabitCard'
import { HabitForm } from '../components/HabitForm'
import { useHabitsToday } from '../hooks/use-habits'

/** Los hábitos de hoy: marcarlos, ver la racha y crear nuevos. */
export function HabitsPage() {
  // Una única referencia temporal para todo el render, que además se pone al
  // día sola si la pantalla se queda abierta y cruza la medianoche.
  const today = useToday()
  const todayKey = toDateKey(today)
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
                  <HabitCard todayKey={todayKey} entry={entry} />
                </li>
              ))}
            </ul>
          )}

          <ArchivedHabits />
        </div>
      )}
    </>
  )
}
