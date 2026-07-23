import { NavLink } from 'react-router-dom'

import { UserMenu } from '@/app/layout/UserMenu'
import { NAV_ITEMS } from '@/app/router/navigation'
import { ROUTES } from '@/app/router/routes'
import { ThemeToggle } from '@/core/theme'
import { cn } from '@/shared/lib/utils'

/** Navegación de escritorio (≥ lg). En móvil se usa `BottomNav`. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <span className="text-lg font-semibold tracking-tight">Nexus</span>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === ROUTES.dashboard}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 space-y-3 border-t border-border p-3">
        <UserMenu />
        <ThemeToggle />
      </div>
    </aside>
  )
}
