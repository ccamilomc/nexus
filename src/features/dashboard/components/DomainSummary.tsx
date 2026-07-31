import type { ComponentType } from 'react'

import { ROUTES } from '@/app/router/routes'

import { SUMMARY_ITEMS, type SummaryItem } from '../constants/dashboard-items'
import { HabitsSummaryCard } from './HabitsSummaryCard'
import { HealthSummaryCard } from './HealthSummaryCard'
import { NutritionSummaryCard } from './NutritionSummaryCard'
import { SleepSummaryCard } from './SleepSummaryCard'
import { StudySummaryCard } from './StudySummaryCard'
import { SummaryCard } from './SummaryCard'
import { WorkoutSummaryCard } from './WorkoutSummaryCard'

/**
 * Dominios ya conectados a sus datos, por ruta.
 *
 * Cada módulo se añade aquí cuando aterriza. Los que faltan siguen mostrando su
 * estado vacío, así el dashboard no cambia de forma con cada sprint.
 */
const CONNECTED_CARDS: Readonly<Record<string, ComponentType<SummaryItem>>> = {
  [ROUTES.workout]: WorkoutSummaryCard,
  [ROUTES.nutrition]: NutritionSummaryCard,
  [ROUTES.habits]: HabitsSummaryCard,
  [ROUTES.study]: StudySummaryCard,
  [ROUTES.sleep]: SleepSummaryCard,
  [ROUTES.health]: HealthSummaryCard,
}

/** Resumen por dominio: el estado del día de un vistazo. */
export function DomainSummary() {
  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="mb-3 text-sm font-medium text-muted-foreground">
        Tu día
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUMMARY_ITEMS.map((item) => {
          const Connected = CONNECTED_CARDS[item.to]

          return Connected ? (
            <Connected key={item.label} {...item} />
          ) : (
            <SummaryCard key={item.label} to={item.to} label={item.label} Icon={item.Icon}>
              <p className="text-sm text-muted-foreground">{item.emptyLabel}</p>
            </SummaryCard>
          )
        })}
      </div>
    </section>
  )
}
