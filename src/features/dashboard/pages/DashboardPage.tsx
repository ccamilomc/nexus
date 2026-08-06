import { InstallBanner } from '@/app/layout/InstallBanner'

import { DomainSummary } from '../components/DomainSummary'
import { QuickActions } from '../components/QuickActions'
import { useDashboard } from '../hooks/use-dashboard'

export function DashboardPage() {
  const { name, greeting, todayLabel } = useDashboard()

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">{todayLabel}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting}
          {name ? `, ${name}` : ''}
        </h1>
      </header>

      {/* Tras el saludo y no encima: se ofrece, no se interrumpe. */}
      <InstallBanner />

      <QuickActions />
      <DomainSummary />
    </div>
  )
}
