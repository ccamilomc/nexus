import { CalendarCheck, Compass, Plus } from 'lucide-react'
import { useState } from 'react'

import { useToday } from '@/core/time'
import { EmptyState, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui/button'

import { PlanItemForm } from '../components/PlanItemForm'
import { PlanSchedule } from '../components/PlanSchedule'
import { RecommendationCard } from '../components/RecommendationCard'
import { useDailyPlan } from '../hooks/use-daily-plan'
import { useDismissRecommendation } from '../hooks/use-dismissed'
import {
  useAddPlanItem,
  useRemovePlanItem,
  useSetPlanItemStatus,
  useTodayPlan,
} from '../hooks/use-today-plan'

/**
 * El plan del día, en dos capas que no se mezclan.
 *
 * Arriba, **lo que el usuario se propuso**: su agenda, que él decide. Abajo, lo
 * que el motor sugiere a la vista de lo registrado. Juntarlas haría que las
 * sugerencias parecieran obligaciones, y Nexus recomienda: quien decide es él.
 */
export function PlanningPage() {
  const today = useToday()
  const { isPending, recommendations, isClear, isBlank } = useDailyPlan()
  const plan = useTodayPlan(today)
  const dismiss = useDismissRecommendation(today)
  const addItem = useAddPlanItem(today)
  const setStatus = useSetPlanItemStatus()
  const removeItem = useRemovePlanItem()
  const [isAdding, setIsAdding] = useState(false)

  const items = plan.data?.items ?? []
  const isBusy = setStatus.isPending || removeItem.isPending

  return (
    <>
      <PageHeader title="Plan" description="Lo que te propusiste y lo que te falta hoy." />

      {isPending ? (
        <SkeletonList label="Preparando tu plan de hoy" rows={3} rowClassName="h-20" />
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="schedule-title" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="schedule-title"
                className="text-xs font-semibold uppercase tracking-wide text-primary"
              >
                Tu día
              </h2>
              {isAdding ? null : (
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
                  <Plus className="mr-1 h-4 w-4" aria-hidden />
                  Añadir
                </Button>
              )}
            </div>

            {isAdding ? (
              <PlanItemForm
                onSubmit={(values) =>
                  addItem.mutate(values, { onSuccess: () => setIsAdding(false) })
                }
                onCancel={() => setIsAdding(false)}
                isSaving={addItem.isPending}
                errorMessage={addItem.error?.message ?? null}
              />
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No te has propuesto nada para hoy. Puedes dejarlo así: Nexus sigue mirando lo que
                registras.
              </p>
            ) : (
              <PlanSchedule
                items={items}
                onToggle={(item) =>
                  setStatus.mutate({
                    itemId: item.id,
                    status: item.status === 'done' ? 'pending' : 'done',
                  })
                }
                onRemove={(itemId) => removeItem.mutate(itemId)}
                isBusy={isBusy}
              />
            )}
          </section>

          <section aria-labelledby="suggestions-title" className="space-y-3">
            <h2
              id="suggestions-title"
              className="text-xs font-semibold uppercase tracking-wide text-primary"
            >
              Lo que te falta
            </h2>

            {/* «No te falta nada» y «no has empezado» se cuentan distinto: el
                motor calla en los dos casos, pero sólo en uno de ellos ir al día
                significa algo. Ver `utils/blank-slate.ts`. */}
            {isClear ? (
              isBlank ? (
                <EmptyState
                  icon={Compass}
                  title="Aún no hay nada que seguir"
                  description="Nexus avisa comparando lo que registras con tus objetivos, tus hábitos y tu rutina. En cuanto pongas alguno, esto se llena solo."
                />
              ) : (
                <EmptyState
                  icon={CalendarCheck}
                  title="Vas al día"
                  description="No hay nada pendiente con lo que llevas registrado. Buen momento para descansar."
                />
              )
            ) : (
              <ul className="space-y-3">
                {recommendations.map((recommendation) => (
                  <li key={recommendation.key}>
                    <RecommendationCard
                      recommendation={recommendation}
                      onDismiss={() => dismiss.mutateAsync(recommendation)}
                      isDismissing={dismiss.isPending}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}
