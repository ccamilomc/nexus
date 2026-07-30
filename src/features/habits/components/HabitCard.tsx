import { Check } from 'lucide-react'

import { FormAlert } from '@/shared/components/feedback'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { cn } from '@/shared/lib/utils'

import { useArchiveHabit, useToggleHabit } from '../hooks/use-habits'
import type { HabitToday } from '../types/habits.types'
import { HabitConsistencyBar } from './HabitConsistencyBar'
import { HabitStreak } from './HabitStreak'
import { HabitWeek } from './HabitWeek'

interface HabitCardProps {
  readonly date: Date
  readonly entry: HabitToday
}

/** Un hábito: marcarlo hoy, su racha y sus últimos días. */
export function HabitCard({ date, entry }: HabitCardProps) {
  const { habit, isDoneToday, streak, recentDays, consistency } = entry
  const toggle = useToggleHabit(date)
  const archive = useArchiveHabit()

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          {/* El botón es el gesto principal: grande y de un solo toque. */}
          <button
            type="button"
            role="switch"
            aria-checked={isDoneToday}
            aria-label={`${habit.name}: marcar como ${isDoneToday ? 'no cumplido' : 'cumplido'} hoy`}
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ habitId: habit.id, isDone: isDoneToday })}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:opacity-50',
              isDoneToday
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input text-muted-foreground hover:border-primary/50',
            )}
          >
            <Check className="h-5 w-5" aria-hidden />
          </button>

          <div className="min-w-0 flex-1">
            <p className={cn('font-medium', isDoneToday && 'text-muted-foreground line-through')}>
              {habit.name}
            </p>
            {habit.description ? (
              <p className="truncate text-xs text-muted-foreground">{habit.description}</p>
            ) : null}
            <HabitStreak streak={streak} />
          </div>
        </div>

        <HabitConsistencyBar consistency={consistency} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <HabitWeek days={recentDays} />
          <ConfirmButton
            label="Archivar"
            confirmLabel="Sí, archivar"
            size="sm"
            disabled={archive.isPending}
            onConfirm={() => archive.mutate(habit.id)}
            className="text-muted-foreground"
          />
        </div>

        {toggle.isError ? <FormAlert>{toggle.error.message}</FormAlert> : null}
        {archive.isError ? <FormAlert>{archive.error.message}</FormAlert> : null}
      </CardContent>
    </Card>
  )
}
