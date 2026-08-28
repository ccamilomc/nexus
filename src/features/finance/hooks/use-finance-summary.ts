import { useToday } from '@/core/time'
import type { DomainSummaryData, SummaryProgress } from '@/shared/types'
import { formatCop } from '@/shared/utils'

import { useBudgets, useMonth } from './use-finance'

/**
 * Resumen de finanzas para otras pantallas (el dashboard).
 *
 * El módulo decide **cómo se cuenta lo suyo** y quien lo muestra sólo lo coloca,
 * igual que los otros seis dominios.
 *
 * **La barra es el tope más apretado del mes, y sólo uno.** Dibujar un avance
 * exige una meta: el gasto total no la tiene —gastar no es avanzar hacia nada—
 * pero un tope por categoría sí. Enseñar los cinco convertiría una tarjeta de
 * resumen en la pantalla de finanzas; el que va más justo es el único que puede
 * cambiar lo que hagas hoy, y el resto está a un toque.
 */
export type FinanceSummary = DomainSummaryData

export function useFinanceSummary(): FinanceSummary {
  const today = useToday()
  const { data, isPending } = useMonth(today)
  const budgets = useBudgets(today)

  const totals = data?.totals

  // **El presupuesto del mes manda sobre el tope más apretado.** Es el marco:
  // «llevas 1.850.000 de 2.500.000» contesta la pregunta entera, mientras que
  // «Mercado, 480.000 de 600.000» contesta una parte. Sin presupuesto puesto se
  // cae al tope que va más justo, que es el único que puede cambiar lo que
  // hagas hoy. Sin ninguno de los dos no hay barra, y eso es correcto: la meta
  // la pone el usuario, no Nexus.
  //
  // Los topes vienen ordenados de más apretado a menos, así que basta el primero.
  const monthBudget = budgets.data?.month ?? null
  const tightest = budgets.data?.categories?.[0]

  const headline = monthBudget
    ? { label: 'Presupuesto del mes', spent: monthBudget.spent, cap: monthBudget.cap }
    : tightest
      ? { label: tightest.name, spent: tightest.spent, cap: tightest.cap }
      : null

  const progress: readonly SummaryProgress[] = headline
    ? [
        {
          label: headline.label,
          value: headline.spent,
          target: headline.cap,
          display: `${formatCop(headline.spent)} de ${formatCop(headline.cap)}`,
        },
      ]
    : []

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
    progress,
  }
}
