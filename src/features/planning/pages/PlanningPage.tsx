import { CalendarCheck } from 'lucide-react'

import { EmptyState, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { RecommendationCard } from '../components/RecommendationCard'
import { useDailyPlan } from '../hooks/use-daily-plan'

/**
 * El plan del día: qué falta, según lo que ya se ha registrado.
 *
 * Nexus **sugiere**; quien decide es el usuario. Por eso cada tarjeta lleva su
 * motivo y ninguna obliga a nada.
 */
export function PlanningPage() {
  const { isPending, recommendations, isClear } = useDailyPlan()

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
            <li key={`${recommendation.domain ?? 'general'}-${recommendation.title}`}>
              <RecommendationCard recommendation={recommendation} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
