// El reparto del gasto, compartido con el Dashboard: dos criterios para «en
// qué se fue» se notarían al comparar las dos pantallas.
export { CategoryBreakdown } from './components/CategoryBreakdown'
export type { FinanceSeries } from './hooks/use-finance-series'
export { useFinanceSeries } from './hooks/use-finance-series'
export { useFinanceSummary } from './hooks/use-finance-summary'
// Lo normal en tramos, para que el panel compare contra lo tuyo y no contra el
// tramo anterior, que es una muestra de uno.
export { useSpendingTypicals } from './hooks/use-finance'
export { windowTypicalOf } from './utils/category-typicals'
// Lo que finanzas deja pendiente sin red; lo registra `app/` (ADR-0011).
export { registerFinanceOfflineMutations } from './offline'
export { AccountsPage } from './pages/AccountsPage'
export { CategoriesPage } from './pages/CategoriesPage'
export { DebtsPage } from './pages/DebtsPage'
export { FinancePage } from './pages/FinancePage'
export { RecurringPage } from './pages/RecurringPage'
