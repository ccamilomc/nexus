import { CalendarCheck } from 'lucide-react'

import { useToday } from '@/core/time'
import { EmptyState, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { RecommendationCard } from '../components/RecommendationCard'
import { useDailyPlan } from '../hooks/use-daily-plan'
import { useDismissRecommendation } from '../hooks/use-dismissed'

/**
 * El plan del día: qué falta, según lo que ya se ha registrado.
 *
 * Nexus **sugiere**; quien decide es el usuario. Por eso cada tarjeta lleva su
 * motivo y ninguna obliga a nada.
 */
export function PlanningPage() {
  const today = useToday()
  const { isPending, recommendations, isClear } = useDailyPlan()
  const dismiss = useDismissRecommendation(today)

  return (
    <>
      <PageHeader title="Plan" description="Lo que te falta hoy, según lo que llevas registrado." />

      {isPending ? (
        <SkeletonList label="Preparando tu plan de hoy" rows={3} rowClassName="h-20" />
      ) : isClear ? (
        <EmptyState
          icon={CalendarCheck}
          title="Vas al día"
          description="No hay nada pendiente con lo que llevas registrado. Buen momento para descansar."
        />
      ) : (
        <ul className="space-y-3">
          {recommendations.map((recommendation) => (
            <li key={recommendation.key}>
              <RecommendationCard
                recommendation={recommendation}
                onDismiss={() => dismiss.mutate(recommendation)}
                isDismissing={dismiss.isPending}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
