import { Progress } from '@/shared/components/ui/progress'
import { formatCop } from '@/shared/utils'

import type { CategorySpend } from '../types/finance.types'

/**
 * Cuántas categorías se enseñan antes de resumir el resto.
 *
 * Cinco cubren casi siempre el grueso del gasto sin convertir el reparto en una
 * lista que hay que leer entera.
 */
const TOP_CATEGORIES = 5

/**
 * En qué se fue el dinero, de más a menos.
 *
 * **Barras y no un círculo:** comparar longitudes es fácil y comparar ángulos
 * no, y aquí la pregunta es cuál pesa más. Horizontales porque los nombres son
 * palabras («Suscripciones», «Restaurantes»), que en vertical habría que girar.
 *
 * La cifra va **siempre al lado de la barra**: quien no distingue la longitud
 * —o no ve la barra— tiene el dato igual.
 *
 * Lo que no cabe se resume, no se calla: un reparto que suma menos del total
 * invita a confiar en una cifra incompleta.
 */
export function CategoryBreakdown({
  byCategory,
}: {
  readonly byCategory: readonly CategorySpend[]
}) {
  if (byCategory.length === 0) return null

  const visible = byCategory.slice(0, TOP_CATEGORIES)
  const rest = byCategory.slice(TOP_CATEGORIES)
  const restAmount = rest.reduce((sum, category) => sum + category.amount, 0)

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        En qué se fue
      </h3>

      {visible.map((category) => (
        <div key={category.categoryId ?? 'sin-categoria'} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-sm">{category.name}</span>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {formatCop(category.amount)}
            </span>
          </div>
          <Progress
            value={category.share}
            label={`${category.name}: ${formatCop(category.amount)}`}
          />
        </div>
      ))}

      {rest.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Y {rest.length} {rest.length === 1 ? 'categoría más' : 'categorías más'} por{' '}
          {formatCop(restAmount)}.
        </p>
      ) : null}
    </div>
  )
}
