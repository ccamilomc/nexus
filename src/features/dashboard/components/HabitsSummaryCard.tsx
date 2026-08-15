import { Check } from 'lucide-react'

import { useHabitsSummary, useQuickHabits } from '@/features/habits'

import type { SummaryItem } from '../constants/dashboard-items'
import { SummaryCard } from './SummaryCard'
import { SummaryLines } from './SummaryLines'

/** Tarjeta de hábitos: lo cumplido hoy y los que faltan, para marcarlos aquí. */
export function HabitsSummaryCard({ to, label, Icon, emptyLabel }: SummaryItem) {
  const { isPending, isEmpty, lines, progress } = useHabitsSummary()
  const quick = useQuickHabits()

  return (
    <SummaryCard to={to} label={label} Icon={Icon}>
      <SummaryLines
        isPending={isPending}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        lines={lines}
        progress={progress}
        loadingLabel="Cargando tus hábitos de hoy"
      />

      {quick.pending.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {quick.pending.map((habit) => (
            <li key={habit.id}>
              {/* Sin `WIDE_TAP_AREA`: van uno debajo de otro y sus áreas se
                  solaparían, así que el alto es real. */}
              <button
                type="button"
                onClick={() => quick.mark(habit.id)}
                aria-label={`Marcar ${habit.name} como cumplido hoy`}
                className="flex h-11 w-full items-center gap-2 rounded-md border border-border px-3 text-left text-sm transition-colors duration-fast ease-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Check className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{habit.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {quick.hiddenCount > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Y {quick.hiddenCount} más en Hábitos.</p>
      ) : null}

      {quick.isAllDone ? <p className="mt-3 text-sm text-success">Todo hecho hoy.</p> : null}

      {quick.errorMessage ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {quick.errorMessage}
        </p>
      ) : null}
    </SummaryCard>
  )
}
