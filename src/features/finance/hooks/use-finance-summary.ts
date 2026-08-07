import { useToday } from '@/core/time'
import type { DomainSummaryData } from '@/shared/types'
import { formatCop } from '@/shared/utils'

import { useMonth } from './use-finance'

/**
 * Resumen de finanzas para otras pantallas (el dashboard).
 *
 * El módulo decide **cómo se cuenta lo suyo** y quien lo muestra sólo lo coloca,
 * igual que los otros seis dominios.
 *
 * **Sin barra todavía, y no por falta de datos.** Dibujar un avance exige una
 * meta, y los presupuestos por categoría llegan en una fase posterior. Cuando
 * existan, el gasto del mes contra su tope es exactamente la barra que toca —y
 * entonces `isExceeded` de `Progress` se gana su sitio, porque pasarse del
 * presupuesto sí es un aviso.
 */
export type FinanceSummary = DomainSummaryData

export function useFinanceSummary(): FinanceSummary {
  const today = useToday()
  const { data, isPending } = useMonth(today)

  const totals = data?.totals

  return {
    isPending,
    isEmpty: !isPending && (!totals || (totals.income === 0 && totals.expense === 0)),
    lines: totals
      ? [
          `Gastado este mes: ${formatCop(totals.expense)}`,
          // El saldo sólo se menciona si hubo ingresos: sin ellos sería repetir
          // el gasto con el signo cambiado.
          ...(totals.income > 0 ? [`Balance: ${formatCop(totals.balance)}`] : []),
        ]
      : [],
    progress: [],
  }
}
