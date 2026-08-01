import { PageHeader } from '@/shared/components/layout'

import { PeriodSelector } from '../components/PeriodSelector'
import { SleepAnalytics } from '../components/SleepAnalytics'
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

        <WorkoutAnalytics window={window} />
        <SleepAnalytics window={window} />
      </div>
    </>
  )
}
