import { cn } from '@/shared/lib/utils'

import type { Macros } from '../types/nutrition.types'
import { formatCalories, formatGrams } from '../utils/format'

interface MacroSummaryProps {
  readonly macros: Macros
  /** Versión compacta para la cabecera de cada comida. */
  readonly compact?: boolean
}

/**
 * Calorías y macros de un conjunto de alimentos.
 *
 * En compacto las cifras llevan su inicial —`P`, `C`, `G`—. Sin ellas eran tres
 * números en gramos idénticos, «27,5 g · 61,8 g · 19,8 g», y había que saberse
 * el orden de memoria; un lector de pantalla los leía sin decir de qué eran. Es
 * además como ya se escriben en el catálogo de alimentos, así que el mismo dato
 * deja de contarse de dos maneras dentro del mismo módulo.
 */
export function MacroSummary({ macros, compact = false }: MacroSummaryProps) {
  const items: readonly { label: string; short: string; value: string }[] = [
    { label: 'Calorías', short: '', value: formatCalories(macros.calories) },
    { label: 'Proteína', short: 'P', value: formatGrams(macros.proteinG) },
    { label: 'Carbos', short: 'C', value: formatGrams(macros.carbsG) },
    { label: 'Grasa', short: 'G', value: formatGrams(macros.fatG) },
  ]

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground">
        {items.map(({ short, value }) => (short ? `${short} ${value}` : value)).join(' · ')}
      </p>
    )
  }

  return (
    <dl className={cn('flex flex-wrap gap-x-6 gap-y-2')}>
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
