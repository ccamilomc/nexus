import { PageHeader } from '@/shared/components/layout'

import { FinanceAnalytics } from '../components/FinanceAnalytics'
import { HabitsAnalytics } from '../components/HabitsAnalytics'
import { HealthAnalytics } from '../components/HealthAnalytics'
import { NutritionAnalytics } from '../components/NutritionAnalytics'
import { PeriodSelector } from '../components/PeriodSelector'
import { SleepAnalytics } from '../components/SleepAnalytics'
import { StudyAnalytics } from '../components/StudyAnalytics'
import { WorkoutAnalytics } from '../components/WorkoutAnalytics'
import { useAnalyticsPeriod } from '../hooks/use-analytics-period'

/**
 * Analíticas: cómo han ido las cosas en un periodo, dominio por dominio.
 *
 * La página no calcula nada. Elige el periodo y lo reparte; cada dominio trae
 * sus propias cifras desde su barrel, porque sólo él sabe cómo se cuenta lo
 * suyo (ver docs/adr/0006).
 */
export function AnalyticsPage() {
  const { periodId, setPeriodId, window } = useAnalyticsPeriod()

  return (
    <>
      <PageHeader title="Analíticas" description="Cómo han ido tus últimas semanas." />

      <div className="space-y-6">
        <PeriodSelector value={periodId} onChange={setPeriodId} />

        {/* El mismo orden que la navegación, para que la página no obligue a
            buscar. Salud va al final: es la única sección que no compara ni
            opina, y cierra sin arrastrar ese tono a las demás. */}
        <FinanceAnalytics window={window} />
        <WorkoutAnalytics window={window} />
        <NutritionAnalytics window={window} />
        <HabitsAnalytics window={window} />
        <StudyAnalytics window={window} />
        <SleepAnalytics window={window} />
        <HealthAnalytics window={window} />
      </div>
    </>
  )
}
