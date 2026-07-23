import { Link } from 'react-router-dom'

import { NAV_ITEMS } from '@/app/router/navigation'
import { PageHeader } from '@/shared/components/layout'

/** Índice de módulos. Da acceso en móvil a lo que no cabe en la barra inferior. */
export function MorePage() {
  return (
    <>
      <PageHeader title="Módulos" description="Todo lo que Nexus organiza por ti." />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {NAV_ITEMS.map(({ to, label, description, Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{label}</span>
                <span className="block text-sm text-muted-foreground">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
