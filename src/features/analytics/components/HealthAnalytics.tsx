import { HeartPulse } from 'lucide-react'

import { ROUTES } from '@/app/router/routes'
import { formatChange, formatValue, useWeightSeries } from '@/features/health'
import { EmptyState } from '@/shared/components/feedback'

import { MIN_DAYS_FOR_TREND } from '../constants/analytics.constants'
import type { PeriodWindow } from '../types/analytics.types'
import { fittedAxis } from '../utils/axis'
import { formatCount } from '../utils/format'
import { AnalyticsSection } from './AnalyticsSection'
import { KpiCard } from './KpiCard'
import { TrendChart } from './TrendChart'

interface HealthAnalyticsProps {
  readonly window: PeriodWindow
}

/** El eje del peso se cuadra a kilos enteros. */
const KILOGRAM = 1

/**
 * El peso del periodo. La única sección que **no compara ni opina**.
 *
 * Todas las `KpiCard` van con `comparison={null}` a propósito: la flecha de
 * subida o bajada, aunque sea gris, convierte una medición del cuerpo de
 * alguien en un veredicto. El cambio se da como lo que es —una resta con su
 * signo— y quien lo lee decide qué significa. Es la misma regla que ya siguen
 * la pantalla de Salud y el motor, que no tiene ninguna regla sobre el peso.
 */
export function HealthAnalytics({ window }: HealthAnalyticsProps) {
  const { isPending, isError, errorMessage, retry, data } = useWeightSeries(
    window.range,
    window.days,
  )

  const weightAxis = data ? fittedAxis(data.points, KILOGRAM) : null

  return (
    <AnalyticsSection
      title="Salud"
      Icon={HeartPulse}
      to={ROUTES.health}
      isPending={isPending}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={retry}
    >
      {!data || data.measurements === 0 ? (
        <EmptyState
          icon={HeartPulse}
          title="Sin pesajes"
          description={`No hay peso registrado ${window.period.description}. Lo que apuntes aparecerá aquí.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiCard
              label="Último peso"
              value={data.latestKg === null ? '—' : formatValue(data.latestKg, data.unit)}
              comparison={null}
              hint={null}
            />
            <KpiCard
              label="Cambio en el periodo"
              value={data.changeKg === null ? '—' : formatChange(data.changeKg, data.unit)}
              comparison={null}
              hint={
                data.changeKg === null
                  ? 'Hace falta más de un pesaje'
                  : 'Entre el primero y el último'
              }
            />
            <KpiCard
              label="Pesajes"
              value={String(data.measurements)}
              comparison={null}
              hint={`De ${window.period.days} días`}
            />
          </div>

          {data.measurements < MIN_DAYS_FOR_TREND ? (
            <EmptyState
              title="Aún no hay tendencia que dibujar"
              description={`Con ${formatCount(data.measurements, 'pesaje', 'pesajes')} no se ve una tendencia. Desde ${MIN_DAYS_FOR_TREND} empieza a notarse.`}
            />
          ) : (
            <TrendChart
              label={`Peso ${window.period.description}`}
              points={data.points}
              variant="line"
              colorIndex="neutral"
              formatValue={(kilograms) => formatValue(kilograms, data.unit)}
              formatAxisValue={(kilograms) => String(Math.round(kilograms))}
              {...(weightAxis ? { verticalAxis: weightAxis } : {})}
            />
          )}
        </div>
      )}
    </AnalyticsSection>
  )
}
