import { ChevronDown, History } from 'lucide-react'
import { useState } from 'react'

import { FormAlert, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

import { useRetiredGoals } from '../hooks/use-nutrition'
import type { NutritionGoal } from '../types/nutrition.types'
import { formatCalories, formatGrams, formatVolumeMl } from '../utils/format'

/** «8 de agosto de 2026», que es como se lee una fecha vieja. */
function formatEffectiveFrom(date: string): string {
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Los objetivos que se perseguían antes.
 *
 * La pantalla ya prometía que al cambiarlos «queda constancia de qué perseguías
 * en cada momento», y esa constancia estaba en la base sin manera de mirarla:
 * una promesa que la aplicación no cumplía.
 *
 * Va plegado y **sólo se consulta al abrirlo**, como los hábitos archivados: es
 * algo que se mira de vez en cuando, no cada vez que se entra.
 */
export function GoalHistory() {
  const [isOpen, setIsOpen] = useState(false)
  const { data, isPending, isError, error } = useRetiredGoals(isOpen)

  return (
    <section className="border-t border-border pt-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="text-muted-foreground"
      >
        <History aria-hidden />
        Objetivos anteriores
        <ChevronDown className={cn('transition-transform', isOpen && 'rotate-180')} aria-hidden />
      </Button>

      {isOpen ? (
        <div className="mt-3">
          {isPending ? (
            <SkeletonList label="Cargando los objetivos anteriores" rows={2} rowClassName="h-12" />
          ) : isError ? (
            <FormAlert>{error.message}</FormAlert>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no has cambiado tus objetivos, así que no hay nada anterior que enseñar.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.map((goal) => (
                <RetiredGoalRow key={goal.id} goal={goal} />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}

/** Un objetivo jubilado: desde cuándo regía y qué pedía. */
function RetiredGoalRow({ goal }: { readonly goal: NutritionGoal }) {
  return (
    <li className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">
        Desde el {formatEffectiveFrom(goal.effective_from)}
      </p>
      <p className="text-sm tabular-nums">
        {formatCalories(goal.calories_target)} · P {formatGrams(goal.protein_g_target)} · C{' '}
        {formatGrams(goal.carbs_g_target)} · G {formatGrams(goal.fat_g_target)} ·{' '}
        {formatVolumeMl(goal.water_ml_target)}
      </p>
    </li>
  )
}
