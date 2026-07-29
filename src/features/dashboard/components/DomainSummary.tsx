import { ROUTES } from '@/app/router/routes'

import { SUMMARY_ITEMS } from '../constants/dashboard-items'
import { NutritionSummaryCard } from './NutritionSummaryCard'
import { SummaryCard } from './SummaryCard'

/**
 * Resumen por dominio.
 *
 * Cada módulo se va conectando conforme aterriza; los que aún no lo están
 * muestran su estado vacío en lugar de desaparecer, para que el dashboard no
 * cambie de forma con cada sprint.
 */
export function DomainSummary() {
  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="mb-3 text-sm font-medium text-muted-foreground">
        Tu día
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUMMARY_ITEMS.map(({ to, label, Icon, emptyLabel }) =>
          to === ROUTES.nutrition ? (
            <NutritionSummaryCard
              key={label}
              to={to}
              label={label}
              Icon={Icon}
              emptyLabel={emptyLabel}
            />
          ) : (
            <SummaryCard key={label} to={to} label={label} Icon={Icon}>
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
            </SummaryCard>
          ),
        )}
      </div>
    </section>
  )
}
