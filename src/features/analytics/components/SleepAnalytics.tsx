import { Moon } from 'lucide-react'

import { ROUTES } from '@/app/router/routes'
import { useSleepSeries } from '@/features/sleep'
import { EmptyState } from '@/shared/components/feedback'
import { formatMinutes } from '@/shared/utils'

import { MIN_DAYS_FOR_TREND } from '../constants/analytics.constants'
import type { PeriodWindow } from '../types/analytics.types'
import { compareValues } from '../utils/comparison'
import { formatCount } from '../utils/format'
import { AnalyticsSection } from './AnalyticsSection'
import { KpiCard } from './KpiCard'
import { TrendChart } from './TrendChart'

interface SleepAnalyticsProps {
  readonly window: PeriodWindow
}

/**
 * El sueño del periodo: cuánto se durmió de media, cuántas noches y su forma.
 *
 * Las medias se calculan sobre las noches **registradas**, así que se dice
 * cuántas son: una media de 7 h sobre tres noches de treinta días no es lo
 * mismo que sobre veintiocho, y ocultarlo sería presentarla como algo que no es.
 */
export function SleepAnalytics({ window }: SleepAnalyticsProps) {
  const { isPending, isError, errorMessage, retry, data } = useSleepSeries(
    window.days,
    window.previousDays,
  )

  return (
    <AnalyticsSection
      title="Sueño"
      Icon={Moon}
      to={ROUTES.sleep}
      isPending={isPending}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={retry}
    >
      {!data || data.nightsLogged === 0 ? (
        <EmptyState
          icon={Moon}
          title="Sin noches registradas"
          description={`No hay sueño apuntado ${window.period.description}. En cuanto registres alguna noche aparecerá aquí.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiCard
              label="Media por noche"
              value={formatMinutes(data.averageMinutes)}
              comparison={compareValues(data.averageMinutes, data.previousAverageMinutes)}
              hint={
                data.previousAverageMinutes === null
                  ? 'Sin periodo anterior con que comparar'
                  : null
              }
            />
            <KpiCard
              label="Noches apuntadas"
              value={formatCount(data.nightsLogged, 'noche', 'noches')}
              comparison={null}
              hint={`De ${window.period.days} días`}
            />
            <KpiCard
              label="Calidad media"
              value={data.averageQuality === null ? '—' : `${data.averageQuality} / 5`}
              comparison={null}
              hint={data.averageQuality === null ? 'Ninguna noche valorada' : 'Sobre las valoradas'}
            />
          </div>

          {data.nightsLogged < MIN_DAYS_FOR_TREND ? (
            <EmptyState
              title="Aún no hay tendencia que dibujar"
              description={`Con ${formatCount(data.nightsLogged, 'noche', 'noches')} sale una línea, no una tendencia. Desde ${MIN_DAYS_FOR_TREND} empieza a verse la forma.`}
            />
          ) : (
            <TrendChart
              label={`Sueño por noche ${window.period.description}`}
              points={data.points}
              variant="line"
              colorIndex={4}
              formatValue={formatMinutes}
              formatAxisValue={(minutes) => `${Math.round(minutes / 60)} h`}
            />
          )}
        </div>
      )}
    </AnalyticsSection>
  )
}
