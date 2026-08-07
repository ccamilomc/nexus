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
}
