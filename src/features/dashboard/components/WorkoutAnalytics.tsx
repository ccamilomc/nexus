import { Dumbbell } from 'lucide-react'

import { ROUTES } from '@/app/router/routes'
import { useWorkoutSeries } from '@/features/workout'
import { EmptyState } from '@/shared/components/feedback'
import { formatMinutes } from '@/shared/utils'

import { NO_PREVIOUS_PERIOD_HINT } from '../constants/dashboard.constants'
import type { PeriodWindow } from '../types/dashboard.types'
import { compareValues } from '../utils/comparison'
import { formatCount, formatDecimal, formatVolumeKg } from '../utils/format'
import { AnalyticsSection } from './AnalyticsSection'
import { KpiCard } from './KpiCard'
import { TrendChart } from './TrendChart'

interface WorkoutAnalyticsProps {
  readonly window: PeriodWindow
}

/** Miles de kilos: en el eje «12k» se lee mejor que «12.400 kg». */
const KILOGRAMS_IN_THOUSAND = 1000

/**
 * El entrenamiento del periodo: cuánto se entrenó, cuánto se levantó y cuándo.
 *
 * El volumen se compara con el tramo anterior sólo si hubo entrenamientos:
 * pasar de cero a algo no es un porcentaje, es haber empezado.
 */
export function WorkoutAnalytics({ window }: WorkoutAnalyticsProps) {
  const { isPending, isError, errorMessage, retry, data } = useWorkoutSeries(
    window.range,
    window.previousRange,
    window.days,
    window.previousDays,
  )

  return (
    <AnalyticsSection
      title="Entrenamiento"
      Icon={Dumbbell}
      to={ROUTES.workout}
      isPending={isPending}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={retry}
    >
      {!data || data.sessionCount === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Sin entrenamientos"
          description={`No hay entrenamientos terminados ${window.description}. Los que registres aparecerán aquí.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Entrenamientos"
              value={String(data.sessionCount)}
              comparison={compareValues(data.sessionCount, data.previousSessionCount)}
              hint={data.previousSessionCount === 0 ? NO_PREVIOUS_PERIOD_HINT : null}
            />
            <KpiCard
              label="Volumen total"
              value={formatVolumeKg(data.totalVolumeKg)}
              comparison={compareValues(data.totalVolumeKg, data.previousTotalVolumeKg)}
              hint={data.previousTotalVolumeKg === 0 ? 'Sin volumen anterior' : null}
            />
            <KpiCard
              label="Duración media"
              value={formatMinutes(data.averageDurationMinutes)}
              comparison={compareValues(
                data.averageDurationMinutes,
                data.previousAverageDurationMinutes,
              )}
              hint="Por entrenamiento"
            />
            <KpiCard
              label="Series"
              value={String(data.setCount)}
              comparison={null}
              hint={formatCount(data.daysTrained, 'día entrenado', 'días entrenados')}
            />
          </div>

          <TrendChart
            label={`Volumen levantado por día ${window.description}`}
            points={data.volumePoints}
            recorded={{
              count: data.daysTrained,
              singular: 'día entrenado',
              plural: 'días entrenados',
            }}
            variant="bar"
            colorIndex={1}
            formatValue={formatVolumeKg}
            formatAxisValue={(kilograms) =>
              kilograms >= KILOGRAMS_IN_THOUSAND
                ? // Con un decimal: redondear 2.500 a «3k» junto a 5.000 «5k»
                  // dibuja una escala que parece irregular sin serlo.
                  `${formatDecimal(kilograms / KILOGRAMS_IN_THOUSAND)}k`
                : String(Math.round(kilograms))
            }
          />
        </div>
      )}
    </AnalyticsSection>
  )
}
