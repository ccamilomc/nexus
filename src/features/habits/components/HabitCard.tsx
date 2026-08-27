import { Check, Pencil } from 'lucide-react'
import { useState } from 'react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { cn } from '@/shared/lib/utils'

import { useArchiveHabit, useToggleHabit } from '../hooks/use-habits'
import type { HabitToday } from '../types/habits.types'
import { describeWeekdays } from '../utils/format'
import { HabitConsistencyBar } from './HabitConsistencyBar'
import { HabitForm } from './HabitForm'
import { HabitStreak } from './HabitStreak'
import { HabitWeek } from './HabitWeek'

interface HabitCardProps {
  /** Día de hoy en `YYYY-MM-DD`. */
  readonly todayKey: string
  readonly entry: HabitToday
}

/** Un hábito: marcarlo hoy, corregir días pasados, su racha y su constancia. */
export function HabitCard({ todayKey, entry }: HabitCardProps) {
  const { habit, isDoneToday, streak, recentDays, consistency } = entry
  const diasDelHabito = describeWeekdays(habit.target_weekdays)
  const toggle = useToggleHabit(todayKey)
  const archive = useArchiveHabit()
  const [isEditing, setIsEditing] = useState(false)

  // Al cambiarlo, el formulario ocupa la tarjeta: es una corrección puntual y
  // así no hay dos sitios donde escribir el mismo nombre.
  if (isEditing) {
    return (
      <HabitForm
        habit={habit}
        onCreated={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

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
            onClick={() =>
              toggle.mutate({ habitId: habit.id, dateKey: todayKey, isDone: isDoneToday })
            }
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
            {/* Los días sólo se dicen cuando son algunos: en un hábito diario,
                escribir «todos los días» es ruido en cada tarjeta. */}
            {diasDelHabito ? (
              <p className="truncate text-xs text-muted-foreground">{diasDelHabito}</p>
            ) : null}
            <HabitStreak streak={streak} daysSinceDone={entry.daysSinceDone} />
          </div>
        </div>

        <HabitConsistencyBar consistency={consistency} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <HabitWeek
            days={recentDays}
            habitName={habit.name}
            disabled={toggle.isPending}
            onToggle={({ dateKey, isDone }) =>
              toggle.mutate({ habitId: habit.id, dateKey, isDone })
            }
          />
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              aria-label={`Cambiar ${habit.name}`}
              onClick={() => setIsEditing(true)}
            >
              <Pencil aria-hidden />
              Cambiar
            </Button>
            <ConfirmButton
              label="Archivar"
              confirmLabel="Sí, archivar"
              size="sm"
              disabled={archive.isPending}
              aria-label={`Archivar ${habit.name}`}
              onConfirm={() => archive.mutate(habit.id)}
              className="text-muted-foreground"
            />
          </div>
        </div>

        {toggle.error ? <FormAlert>{toggle.error.message}</FormAlert> : null}
        {archive.isError ? <FormAlert>{archive.error.message}</FormAlert> : null}
      </CardContent>
    </Card>
  )
}
