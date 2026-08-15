import { PageHeader } from '@/shared/components/layout'

import { FinanceAnalytics } from '../components/FinanceAnalytics'
import { HabitsAnalytics } from '../components/HabitsAnalytics'
import { HealthAnalytics } from '../components/HealthAnalytics'
import { NutritionAnalytics } from '../components/NutritionAnalytics'
import { PeriodHighlights } from '../components/PeriodHighlights'
import { PeriodSelector } from '../components/PeriodSelector'
import { SleepAnalytics } from '../components/SleepAnalytics'
import { StudyAnalytics } from '../components/StudyAnalytics'
import { WorkoutAnalytics } from '../components/WorkoutAnalytics'
import { useDashboardPeriod } from '../hooks/use-dashboard-period'

/**
 * El dashboard: cómo han ido las cosas en un periodo, dominio por dominio.
 *
 * **Es la otra mitad de «Hoy»**, y por eso va justo debajo en la navegación:
 * «Hoy» contesta cómo va el día y esto cómo van las semanas. Se llamaba
 * «Analíticas» y vivía al final de la lista, entre lo transversal, donde
 * parecía una herramienta aparte en vez de la vista de conjunto que es.
 *
 * La página no calcula nada. Elige el periodo y lo reparte; cada dominio trae
 * sus propias cifras desde su barrel, porque sólo él sabe cómo se cuenta lo
 * suyo (ver docs/adr/0006).
 */
export function DashboardPage() {
  const { periodId, setPeriodId, window, goBack, goForward, canGoForward } = useDashboardPeriod()

  return (
    <>
      <PageHeader title="Dashboard" description="Cómo han ido tus últimas semanas." />

      <div className="space-y-6">
        <PeriodSelector
          value={periodId}
          onChange={setPeriodId}
          description={window.description}
          onBack={goBack}
          onForward={goForward}
          canGoForward={canGoForward}
        />

        {/* Lo primero: por dónde empezar a mirar. Debajo, el detalle. */}
        <PeriodHighlights window={window} />

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
