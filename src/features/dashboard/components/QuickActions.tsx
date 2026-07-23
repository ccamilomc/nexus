import { Link } from 'react-router-dom'

import { QUICK_ACTIONS } from '../constants/dashboard-items'

/** Accesos directos a los registros más frecuentes del día. */
export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="mb-3 text-sm font-medium text-muted-foreground">
        Registrar rápido
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {QUICK_ACTIONS.map(({ to, label, Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
