import { Wallet } from 'lucide-react'

import { ROUTES } from '@/app/router/routes'
import { CategoryBreakdown, useFinanceSeries } from '@/features/finance'
import { EmptyState } from '@/shared/components/feedback'
import { formatCop } from '@/shared/utils'

import { NO_PREVIOUS_PERIOD_HINT } from '../constants/dashboard.constants'
import type { PeriodWindow } from '../types/dashboard.types'
import { compareValues } from '../utils/comparison'
import { AnalyticsSection } from './AnalyticsSection'
import { KpiCard } from './KpiCard'

interface FinanceAnalyticsProps {
  readonly window: PeriodWindow
}

/**
 * Las finanzas del periodo: lo que salió, lo que entró y cuándo.
 *
 * **Es el único sitio de Analytics donde hay cifras de dinero**, y es a
 * propósito. Nutrición enseñaba un «Gasto en comida» que salía del precio de lo
 * comido, no de lo pagado; se retiró para que no compitiera con éste, que sí
 * cuenta desembolsos.
 *
 * **La comparación va en gris como en el resto**, aunque finanzas sí opine en su
 * propia pantalla. Aquí «gastaste un 20 % más» puede ser una mudanza o un mal
 * mes, y la flecha no sabe cuál: el dato se enseña, el juicio lo pone el
 * usuario. El balance negativo es la excepción, porque gastar más de lo que
 * entra no es cuestión de interpretación.
 */
export function FinanceAnalytics({ window }: FinanceAnalyticsProps) {
  const { isPending, isError, errorMessage, retry, data } = useFinanceSeries(
    window.days,
    window.previousDays,
  )

  const variableExpense = data ? data.totalExpense - data.fixedExpense : 0

  return (
    <AnalyticsSection
      title="Finanzas"
      Icon={Wallet}
      to={ROUTES.finance}
      isPending={isPending}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={retry}
    >
      {!data || data.daysWithMovements === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin movimientos"
          description={`No hay nada apuntado ${window.description}. Lo que registres aparecerá aquí.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Gastado"
              value={formatCop(data.totalExpense)}
              comparison={compareValues(data.totalExpense, data.previousTotalExpense)}
              hint={data.previousTotalExpense === 0 ? NO_PREVIOUS_PERIOD_HINT : null}
            />
            <KpiCard
              label="Ingresado"
              value={formatCop(data.totalIncome)}
              comparison={compareValues(data.totalIncome, data.previousTotalIncome)}
              hint={data.previousTotalIncome === 0 ? NO_PREVIOUS_PERIOD_HINT : null}
            />
            <KpiCard
              label="Balance"
              value={formatCop(data.balance)}
              comparison={null}
              hint={data.balance < 0 ? 'Gastaste más de lo que entró' : 'Lo que quedó'}
            />
            <KpiCard
              label="De eso, fijos"
              value={formatCop(data.fixedExpense)}
              comparison={null}
              hint={`${formatCop(variableExpense)} los decidiste sobre la marcha`}
            />
          </div>

          {/* Sin gráfica de gasto diario: un día se paga el arriendo y esa
              barra aplasta a las demás, así que la forma se lee pero no dice
              nada. Lo que informa del dinero —en qué se fue y cuánto queda del
              tope— está en Finanzas, con su reparto por categoría. */}
          <CategoryBreakdown byCategory={data.byCategory} />
        </div>
      )}
    </AnalyticsSection>
  )
}
