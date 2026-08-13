import { ROUTES } from '@/app/router/routes'
import { type SectionTab, SectionTabs } from '@/shared/components/layout'

const TABS: readonly SectionTab[] = [
  { to: ROUTES.finance, label: 'Movimientos', end: true },
  { to: ROUTES.financeRecurring, label: 'Fijos' },
  { to: ROUTES.financeDebts, label: 'Deudas' },
  { to: ROUTES.financeAccounts, label: 'Cuentas' },
  { to: ROUTES.financeCategories, label: 'Categorías' },
]

/** Secciones del módulo de finanzas. */
export function FinanceNav() {
  return <SectionTabs label="finanzas" tabs={TABS} />
}
