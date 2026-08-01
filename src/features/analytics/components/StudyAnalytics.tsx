import { BookOpen } from 'lucide-react'

import { ROUTES } from '@/app/router/routes'
import { useStudySeries } from '@/features/study'
import { EmptyState } from '@/shared/components/feedback'
import { formatMinutes } from '@/shared/utils'

import { NO_PREVIOUS_PERIOD_HINT } from '../constants/analytics.constants'
import type { PeriodWindow } from '../types/analytics.types'
import { compareValues } from '../utils/comparison'
import { AnalyticsSection } from './AnalyticsSection'
import { KpiCard } from './KpiCard'
import { TrendChart } from './TrendChart'

interface StudyAnalyticsProps {
  readonly window: PeriodWindow
}

/** Minutos de una hora, para acortar el eje. */
const MINUTES_PER_HOUR = 60

/**
 * El estudio del periodo: cuánto tiempo, en cuántos días y en qué materia.
 *
 * La media es **por día estudiado**, no por día del periodo: responde «cuánto
 * cundes cuando te sientas», que es lo accionable. Repartir el total entre
 * treinta días sólo diría que hay días en que no se estudia, cosa ya sabida.
 */
export function StudyAnalytics({ window }: StudyAnalyticsProps) {
  const { isPending, isError, errorMessage, retry, data } = useStudySeries(
    window.range,
    window.previousRange,
    window.days,
    window.previousDays,
  )

  return (
    <AnalyticsSection
      title="Estudio"
      Icon={BookOpen}
      to={ROUTES.study}
      isPending={isPending}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={retry}
    >
      {!data || data.daysStudied === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin sesiones de estudio"
          description={`No hay estudio registrado ${window.period.description}. Lo que apuntes aparecerá aquí.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Tiempo total"
              value={formatMinutes(data.totalMinutes)}
              comparison={compareValues(data.totalMinutes, data.previousTotalMinutes)}
              hint={data.previousTotalMinutes === 0 ? NO_PREVIOUS_PERIOD_HINT : null}
            />
            <KpiCard
              label="Media por día"
              value={formatMinutes(data.averageMinutesPerStudiedDay)}
              comparison={compareValues(
                data.averageMinutesPerStudiedDay,
                data.previousAverageMinutesPerStudiedDay,
              )}
              hint="De los días estudiados"
            />
            <KpiCard
              label="Días estudiados"
              value={String(data.daysStudied)}
              comparison={compareValues(data.daysStudied, data.previousDaysStudied)}
              hint={`De ${window.period.days} días`}
            />
            <KpiCard
              label="Más estudiada"
              value={data.topSubject?.name ?? '—'}
              comparison={null}
              hint={data.topSubject ? formatMinutes(data.topSubject.minutes) : null}
            />
          </div>

          <TrendChart
            label={`Tiempo estudiado por día ${window.period.description}`}
            points={data.points}
            recorded={{
              count: data.daysStudied,
              singular: 'día estudiado',
              plural: 'días estudiados',
            }}
            variant="bar"
            colorIndex={2}
            formatValue={formatMinutes}
            formatAxisValue={(minutes) =>
              minutes >= MINUTES_PER_HOUR
                ? `${Math.round(minutes / MINUTES_PER_HOUR)} h`
                : `${Math.round(minutes)}`
            }
          />
        </div>
      )}
    </AnalyticsSection>
  )
}
