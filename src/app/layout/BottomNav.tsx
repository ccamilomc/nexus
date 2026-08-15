import { MoreHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { PRIMARY_NAV_ITEMS } from '@/app/router/navigation'
import { ROUTES } from '@/app/router/routes'
import { cn } from '@/shared/lib/utils'

function itemClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex h-full flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
  )
}

/** Navegación móvil (< lg): destinos primarios + acceso a «Más». */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 pb-[env(safe-area-inset-bottom)]">
        {PRIMARY_NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === ROUTES.today} className={itemClassName}>
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink to={ROUTES.more} className={itemClassName}>
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            Más
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
