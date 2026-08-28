import type { FinanceTransactionWithNames } from '../types/finance.types'
import { UNCATEGORISED_LABEL } from './finance-totals'

/**
 * El punto y coma, no la coma.
 *
 * Excel en español usa el punto y coma como separador de listas, porque la coma
 * ya es el separador decimal. Un CSV separado por comas se abre en Colombia con
 * **todo metido en una sola columna**, y es la forma más común de que una
 * exportación parezca rota sin estarlo.
 */
const SEPARATOR = ';'

/** RFC 4180: fin de línea de un CSV, y lo que Excel espera. */
const EOL = '\r\n'

/**
 * La marca que le dice a Excel que el archivo es UTF-8.
 *
 * Sin ella lo abre con la codificación del sistema y «Categoría» sale
 * «CategorÃ­a». No es un detalle: la mitad de las categorías llevan tilde.
 */
const BOM = '\uFEFF'

export const CSV_MIME_TYPE = 'text/csv;charset=utf-8'

const HEADERS = [
  'Fecha',
  'Tipo',
  'Monto',
  'Categoría',
  'Cuenta',
  'Cuenta destino',
  'Nota',
  'Fijo',
] as const

const KIND_LABELS: Readonly<Record<FinanceTransactionWithNames['kind'], string>> = {
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Traspaso',
}

/**
 * Neutraliza el texto que Excel ejecutaría como fórmula.
 *
 * Una nota que empiece por `=`, `+`, `-` o `@` deja de ser texto y pasa a ser
 * una fórmula al abrir el archivo. Con datos propios el riesgo es pequeño, pero
 * la app está pensada para que algún día un entrenador exporte los de otro, y
 * entonces el texto ya no es de fiar.
 *
 * Sólo pasa por aquí lo que escribió una persona. Las fechas y los montos los
 * genera la app, y arrancan con dígito.
 */
function neutralizeFormula(text: string): string {
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

/** Un campo listo para el archivo: entrecomillado sólo cuando hace falta. */
function escapeField(value: string): string {
  const text = neutralizeFormula(value)

  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toRow(transaction: FinanceTransactionWithNames): readonly string[] {
  return [
    // ISO, no `10/08/2026`: el formato del día ordena bien como texto y no se
    // confunde con el americano, donde ese mismo día sería el 8 de octubre.
    transaction.occurred_on,
    KIND_LABELS[transaction.kind],
    // Sin puntos de millar y sin signo. **El monto va siempre en positivo** y
    // quien dice de qué lado cae es la columna «Tipo»: un número con signo
    // invita a sumar la columna entera, y esa suma saldría mal en cuanto haya
    // un traspaso, que ni entra ni sale.
    String(transaction.amount),
    transaction.kind === 'transfer' ? '' : (transaction.category?.name ?? UNCATEGORISED_LABEL),
    transaction.account?.name ?? '',
    transaction.toAccount?.name ?? '',
    transaction.note ?? '',
    // Separar lo fijo de lo que se decide cada día es la cuenta que de verdad
    // se quiere hacer fuera de la app.
    transaction.recurring_id === null ? 'No' : 'Sí',
  ]
}

/**
 * Los movimientos como CSV, en el mismo orden en que llegan.
 *
 * Se exporta **lo que se está viendo**, filtros incluidos. Que el archivo
 * trajera más de lo que enseña la pantalla sería una sorpresa, y el botón dice
 * cuántos son antes de pulsarlo.
 */
export function toTransactionsCsv(transactions: readonly FinanceTransactionWithNames[]): string {
  const rows = transactions.map((transaction) =>
    toRow(transaction).map(escapeField).join(SEPARATOR),
  )

  return BOM + [HEADERS.join(SEPARATOR), ...rows].join(EOL) + EOL
}

/** `nexus-movimientos-2026-08.csv`: se ordena solo en la carpeta de descargas. */
export function transactionsCsvFileName(month: Date): string {
  const year = month.getFullYear()
  const monthNumber = String(month.getMonth() + 1).padStart(2, '0')

  return `nexus-movimientos-${year}-${monthNumber}.csv`
}
