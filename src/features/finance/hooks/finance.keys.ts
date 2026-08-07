/**
 * Claves de TanStack Query del módulo de finanzas.
 *
 * Jerárquicas: invalidar `movements()` refresca lo registrado sin tocar cuentas
 * ni categorías, que cambian de mes en mes y no en cada gasto.
 */
export const financeKeys = {
  all: ['finance'] as const,
  accounts: (userId: string | undefined) => [...financeKeys.all, 'accounts', userId] as const,
  categories: () => [...financeKeys.all, 'categories'] as const,
  movements: () => [...financeKeys.all, 'movements'] as const,
  month: (userId: string | undefined, monthKey: string) =>
    [...financeKeys.movements(), 'month', userId, monthKey] as const,
  // Bajo `movements` a propósito: un abono es un movimiento, así que apuntar
  // uno tiene que refrescar también el saldo de la deuda que baja.
  debts: (userId: string | undefined, todayKey: string) =>
    [...financeKeys.movements(), 'debts', userId, todayKey] as const,
  // También bajo `movements`: confirmar un fijo apunta un movimiento y mueve su
  // fecha, así que las dos cosas tienen que refrescarse juntas.
  recurring: (userId: string | undefined, todayKey: string) =>
    [...financeKeys.movements(), 'recurring', userId, todayKey] as const,
  // Bajo `movements` porque un gasto cambia cuánto llevas del tope.
  budgets: (userId: string | undefined, monthKey: string) =>
    [...financeKeys.movements(), 'budgets', userId, monthKey] as const,
  budgetCaps: (userId: string | undefined) => [...financeKeys.all, 'budget-caps', userId] as const,
}
