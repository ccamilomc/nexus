import { CircleCheck } from 'lucide-react'

import { ROUTES } from '@/app/router/routes'
import { useHabitsSeries } from '@/features/habits'
import { EmptyState } from '@/shared/components/feedback'
import { countDaysWithData } from '@/shared/utils'

import { NO_PREVIOUS_PERIOD_HINT } from '../constants/dashboard.constants'
import type { PeriodWindow } from '../types/dashboard.types'
import { compareValues } from '../utils/comparison'
import { formatCount } from '../utils/format'
import { AnalyticsSection } from './AnalyticsSection'
import { KpiCard } from './KpiCard'
import { TrendChart } from './TrendChart'

interface HabitsAnalyticsProps {
  readonly window: PeriodWindow
}

/**
 * Los hábitos del periodo: constancia, días perfectos y mejor racha.
 *
 * Se mide en porcentaje de lo que tocaba cada día, no en cuenta de hábitos
 * cumplidos: proponerse más hábitos no puede parecer un retroceso.
 */
export function HabitsAnalytics({ window }: HabitsAnalyticsProps) {
  const { isPending, isError, errorMessage, retry, data } = useHabitsSeries(
    window.days,
    window.previousDays,
  )

  const daysWithHabits = data ? countDaysWithData(data.points) : 0

  return (
    <AnalyticsSection
      title="Hábitos"
      Icon={CircleCheck}
      to={ROUTES.habits}
      isPending={isPending}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={retry}
    >
      {!data || data.completionPercent === null ? (
        <EmptyState
          icon={CircleCheck}
          title="Sin hábitos que medir"
          description={`No había ningún hábito activo ${window.description}. En cuanto crees uno, su constancia aparecerá aquí.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Constancia"
              value={`${data.completionPercent} %`}
              comparison={compareValues(data.completionPercent, data.previousCompletionPercent)}
              hint={data.previousCompletionPercent === null ? NO_PREVIOUS_PERIOD_HINT : null}
            />
            <KpiCard
              label="Días perfectos"
              value={String(data.perfectDays)}
              comparison={compareValues(data.perfectDays, data.previousPerfectDays)}
              hint="Cumpliste todo lo que tocaba"
            />
            <KpiCard
              label="Mejor racha"
              value={formatCount(data.bestStreak, 'día', 'días')}
              comparison={null}
              hint="Seguidos, sin fallar"
            />
            <KpiCard
              label="Hábitos activos"
              value={String(data.trackedHabits)}
              comparison={null}
              hint={null}
            />
          </div>

          <TrendChart
            label={`Porcentaje de hábitos cumplidos por día ${window.description}`}
            points={data.points}
            recorded={{
              count: daysWithHabits,
              singular: 'día con hábitos',
              plural: 'días con hábitos',
            }}
            variant="area"
            colorIndex={5}
            formatValue={(percent) => `${Math.round(percent)} %`}
            formatAxisValue={(percent) => `${Math.round(percent)}`}
          />
        </div>
      )}
    </AnalyticsSection>
  )
}
