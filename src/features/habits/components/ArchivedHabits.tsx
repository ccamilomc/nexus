import { Archive, ChevronDown, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import { FormAlert, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

import { useArchivedHabits, useRestoreHabit } from '../hooks/use-habits'

/**
 * Los hábitos archivados, con la opción de recuperarlos.
 *
 * Archivar guarda, no borra: el historial sigue intacto, así que un hábito
 * retirado tiene que poder volver con su racha y su constancia. Va plegado y
 * **sólo se consulta al abrirlo**: es algo que se mira de vez en cuando, no
 * cada día.
 */
export function ArchivedHabits() {
  const [isOpen, setIsOpen] = useState(false)
  const { data, isPending, isError, error } = useArchivedHabits(isOpen)
  const restore = useRestoreHabit()

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
        <Archive aria-hidden />
        Hábitos archivados
        <ChevronDown className={cn('transition-transform', isOpen && 'rotate-180')} aria-hidden />
      </Button>

      {isOpen ? (
        <div className="mt-3">
          {isPending ? (
            <SkeletonList label="Cargando los hábitos archivados" rows={2} rowClassName="h-12" />
          ) : isError ? (
            <FormAlert>{error.message}</FormAlert>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tienes hábitos archivados. Al archivar uno aparecerá aquí, con su historial
              intacto.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.map((habit) => (
                <li
                  key={habit.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{habit.name}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={restore.isPending}
                    aria-label={`Recuperar el hábito ${habit.name}`}
                    onClick={() => restore.mutate(habit.id)}
                  >
                    <RotateCcw aria-hidden />
                    Recuperar
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {restore.isError ? <FormAlert>{restore.error.message}</FormAlert> : null}
        </div>
      ) : null}
    </section>
  )
}
