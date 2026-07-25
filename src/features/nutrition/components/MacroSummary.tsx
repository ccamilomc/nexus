import { cn } from '@/shared/lib/utils'

import type { Macros } from '../types/nutrition.types'
import { formatCalories, formatGrams } from '../utils/format'

interface MacroSummaryProps {
  readonly macros: Macros
  /** Versión compacta para la cabecera de cada comida. */
  readonly compact?: boolean
}

/** Calorías y macros de un conjunto de alimentos. */
export function MacroSummary({ macros, compact = false }: MacroSummaryProps) {
  const items: readonly { label: string; value: string }[] = [
    { label: 'Calorías', value: formatCalories(macros.calories) },
    { label: 'Proteína', value: formatGrams(macros.proteinG) },
    { label: 'Carbos', value: formatGrams(macros.carbsG) },
    { label: 'Grasa', value: formatGrams(macros.fatG) },
  ]

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground">{items.map((item) => item.value).join(' · ')}</p>
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
