import { InstallBanner } from '@/app/layout/InstallBanner'

import { DomainSummary } from '../components/DomainSummary'
import { WaterQuickAdd } from '../components/WaterQuickAdd'
import { useDashboard } from '../hooks/use-dashboard'

/**
 * La primera pantalla: cómo va el día.
 *
 * **El saludo no manda.** Era lo más grande de la pantalla y es lo que menos
 * dice; ahora comparte fila con el agua y deja el tamaño a los datos, que son
 * lo que se viene a mirar.
 */
export function DashboardPage() {
  const { name, greeting, todayLabel } = useDashboard()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{todayLabel}</p>
          <h1 className="mt-0.5 truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {greeting}
            {name ? `, ${name}` : ''}
          </h1>
        </div>

        <WaterQuickAdd />
      </header>

      {/* Tras el saludo y no encima: se ofrece, no se interrumpe. */}
      <InstallBanner />

      <DomainSummary />
    </div>
  )
}
