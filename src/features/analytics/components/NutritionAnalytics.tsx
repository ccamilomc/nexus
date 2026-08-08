import { Apple } from 'lucide-react'

import { ROUTES } from '@/app/router/routes'
import { formatCalories, formatVolumeMl, useNutritionSeries } from '@/features/nutrition'
import { EmptyState } from '@/shared/components/feedback'

import type { PeriodWindow } from '../types/analytics.types'
import { compareValues } from '../utils/comparison'
import { formatCount } from '../utils/format'
import { AnalyticsSection } from './AnalyticsSection'
import { KpiCard } from './KpiCard'
import { TrendChart } from './TrendChart'

interface NutritionAnalyticsProps {
  readonly window: PeriodWindow
}

/** Miles de calorías, para acortar el eje: «2k» en vez de «2.000». */
const CALORIES_IN_THOUSAND = 1000

/**
 * La nutrición del periodo: calorías, agua y días registrados.
 *
 * **Sin cifras de dinero.** Aquí había un «Gasto en comida» que sumaba el
 * precio de lo comido, y no era un gasto: el dinero no sale al comer, sale al
 * comprar. Competía con el de finanzas —que sí cuenta desembolsos— y ninguno de
 * los dos se podía creer del todo. El dinero lo cuenta finanzas, en su propia
 * sección.
 */
export function NutritionAnalytics({ window }: NutritionAnalyticsProps) {
  const { isPending, isError, errorMessage, retry, data } = useNutritionSeries(
    window.range,
    window.previousRange,
    window.days,
    window.previousDays,
  )

  return (
    <AnalyticsSection
      title="Nutrición"
      Icon={Apple}
      to={ROUTES.nutrition}
      isPending={isPending}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={retry}
    >
      {!data || data.daysLogged === 0 ? (
        <EmptyState
          icon={Apple}
          title="Sin comidas registradas"
          description={`No hay nada apuntado ${window.period.description}. Lo que registres aparecerá aquí.`}
        />
      ) : (
        <div className="space-y-3">
          {/* Tres columnas desde que se fue el gasto: con cuatro quedaba un
              hueco a la derecha y las tarjetas se estiraban sin motivo. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiCard
              label="Calorías por día"
              value={data.averageCalories === null ? '—' : formatCalories(data.averageCalories)}
              comparison={compareValues(data.averageCalories, data.previousAverageCalories)}
              hint={`Media de ${formatCount(data.daysLogged, 'día registrado', 'días registrados')}`}
            />
            <KpiCard
              label="Agua por día"
              value={data.averageWaterMl === null ? '—' : formatVolumeMl(data.averageWaterMl)}
              comparison={compareValues(data.averageWaterMl, data.previousAverageWaterMl)}
              hint={data.averageWaterMl === null ? 'Sin registros de agua' : null}
            />
            <KpiCard
              label="Días registrados"
              value={String(data.daysLogged)}
              comparison={null}
              hint={`De ${window.period.days} días`}
            />
          </div>

          <TrendChart
            label={`Calorías por día ${window.period.description}`}
            points={data.caloriePoints}
            recorded={{
              count: data.daysLogged,
              singular: 'día registrado',
              plural: 'días registrados',
            }}
            variant="line"
            colorIndex={3}
            formatValue={formatCalories}
            formatAxisValue={(calories) =>
              calories >= CALORIES_IN_THOUSAND
                ? `${Math.round(calories / CALORIES_IN_THOUSAND)}k`
                : String(Math.round(calories))
            }
          />
        </div>
      )}
    </AnalyticsSection>
  )
}
