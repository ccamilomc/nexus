import { Download } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { downloadTextFile } from '@/shared/utils'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import {
  CSV_MIME_TYPE,
  toTransactionsCsv,
  transactionsCsvFileName,
} from '../utils/transactions-csv'

interface TransactionsExportProps {
  /** Los que se están viendo. Se exporta eso, filtros incluidos. */
  readonly transactions: readonly FinanceTransactionWithNames[]
  readonly month: Date
}

/**
 * Bajarse los movimientos en un archivo que abre Excel.
 *
 * **El botón dice cuántos son antes de pulsarlo.** Un «Exportar» a secas
 * dejaría la duda de si se baja el mes entero o sólo lo filtrado, y esa duda se
 * resuelve abriendo el archivo, que es tarde.
 *
 * Funciona sin conexión: el archivo se arma en el navegador.
 */
export function TransactionsExport({ transactions, month }: TransactionsExportProps) {
  // Sin nada que bajar el botón sobra: la lista de abajo ya explica que no hay
  // movimientos, y un botón apagado sólo añade ruido.
  if (transactions.length === 0) return null

  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          downloadTextFile(
            transactionsCsvFileName(month),
            toTransactionsCsv(transactions),
            CSV_MIME_TYPE,
          )
        }
      >
        <Download aria-hidden />
        Exportar {transactions.length} {transactions.length === 1 ? 'movimiento' : 'movimientos'}
      </Button>
    </div>
  )
}
