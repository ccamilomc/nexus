import { NavLink } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { cn } from '@/shared/lib/utils'

interface FinanceTab {
  readonly to: string
  readonly label: string
  /** «Movimientos» es el índice: sólo se activa con la ruta exacta. */
  readonly end: boolean
}

const TABS: readonly FinanceTab[] = [
  { to: ROUTES.finance, label: 'Movimientos', end: true },
  { to: ROUTES.financeAccounts, label: 'Cuentas', end: false },
  { to: ROUTES.financeCategories, label: 'Categorías', end: false },
]

function tabClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'block truncate rounded-md px-2 py-2 text-center text-xs font-medium sm:px-3 sm:text-sm',
    'transition-colors duration-fast ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  )
}

/** Secciones del módulo de finanzas. */
export function FinanceNav() {
  return (
    <nav aria-label="Secciones de finanzas" className="mb-6">
      <ul className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(({ to, label, end }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink to={to} end={end} className={tabClassName}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
