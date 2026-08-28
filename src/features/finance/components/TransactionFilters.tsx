import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'

import type { FinanceCategory } from '../types/finance.types'
import { NO_CATEGORY, type TransactionFilters as Filters } from '../utils/filter-transactions'

interface TransactionFiltersProps {
  readonly filters: Filters
  readonly onChange: (filters: Filters) => void
  readonly categories: readonly FinanceCategory[]
  /** Cuántos se ven de cuántos hay, para no esconder que se está filtrando. */
  readonly shown: number
  readonly total: number
}

/**
 * Buscar y filtrar los movimientos del mes.
 *
 * **Antes la lista enseñaba ocho y no lo decía.** Con ciento y pico movimientos
 * al mes eso significaba que casi todo lo apuntado era invisible, y que la
 * pregunta más normal —«¿cuándo fue aquel pago?»— no tenía respuesta.
 *
 * Los tres controles caben en una línea en escritorio y se apilan en el móvil.
 * **La cuenta de abajo sólo aparece al filtrar**: sin filtros no hay nada que
 * aclarar, y una cifra permanente sería ruido.
 */
export function TransactionFilters({
  filters,
  onChange,
  categories,
  shown,
  total,
}: TransactionFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <Label htmlFor="finance-search">Buscar</Label>
          <Input
            id="finance-search"
            type="search"
            value={filters.query}
            placeholder="Nota, categoría, cuenta o monto"
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="finance-filter-kind">Tipo</Label>
          <Select
            id="finance-filter-kind"
            value={filters.kind}
            onChange={(event) =>
              onChange({ ...filters, kind: event.target.value as Filters['kind'] })
            }
          >
            <option value="all">Todos</option>
            <option value="expense">Gastos</option>
            <option value="income">Ingresos</option>
            <option value="transfer">Traspasos</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="finance-filter-category">Categoría</Label>
          <Select
            id="finance-filter-category"
            value={filters.categoryId}
            onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
          >
            <option value="all">Todas</option>
            {/* Repasar lo que quedó a medio apuntar es un caso de uso propio, no
                un hueco en la lista. */}
            <option value={NO_CATEGORY}>Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {shown !== total ? (
        <p className="text-xs tabular-nums text-muted-foreground">
          {shown} de {total} {total === 1 ? 'movimiento' : 'movimientos'} del mes
        </p>
      ) : null}
    </div>
  )
}
