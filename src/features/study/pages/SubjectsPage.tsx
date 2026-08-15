import { BookOpen, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'

import { EmptyState, FormAlert, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { formatMinutes } from '@/shared/utils'

import { RetiredSubjects } from '../components/RetiredSubjects'
import { SubjectForm } from '../components/SubjectForm'
import { useDeleteSubject, useSubjects } from '../hooks/use-study'
import type { Subject } from '../types/study.types'

/** Las materias del usuario: crearlas, editarlas y retirarlas. */
export function SubjectsPage() {
  const { data, isPending, isError, error, refetch } = useSubjects()
  const deleteSubject = useDeleteSubject()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (isPending) return <SkeletonList label="Cargando tus materias" rows={3} rowClassName="h-16" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  const editing = data.find((subject) => subject.id === editingId)

  if (editing) {
    return (
      <SubjectForm
        subject={editing}
        onSaved={() => setEditingId(null)}
        onCancel={() => setEditingId(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {isCreating ? (
        <SubjectForm onSaved={() => setIsCreating(false)} onCancel={() => setIsCreating(false)} />
      ) : (
        <Button type="button" onClick={() => setIsCreating(true)}>
          <Plus aria-hidden />
          Crear materia
        </Button>
      )}

      {deleteSubject.isError ? <FormAlert>{deleteSubject.error.message}</FormAlert> : null}

      {data.length === 0 ? (
        isCreating ? null : (
          <EmptyState
            icon={BookOpen}
            title="Aún no tienes materias"
            description="Una materia agrupa lo que estudias: Cálculo, Inglés, la oposición…"
          />
        )
      ) : (
        <ul className="space-y-2">
          {data.map((subject: Subject) => (
            <li
              key={subject.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: subject.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{subject.name}</p>
                <p className="text-xs text-muted-foreground">
                  {subject.weekly_target_minutes === null
                    ? 'Sin objetivo semanal'
                    : `${formatMinutes(subject.weekly_target_minutes)} a la semana`}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                aria-label={`Editar ${subject.name}`}
                onClick={() => setEditingId(subject.id)}
              >
                <Pencil aria-hidden />
              </Button>
              <ConfirmButton
                label="Retirar"
                confirmLabel="Sí, retirar"
                size="sm"
                disabled={deleteSubject.isPending}
                onConfirm={() => deleteSubject.mutate(subject.id)}
                className="text-muted-foreground"
              />
            </li>
          ))}
        </ul>
      )}

      {/* «Retirar» suena a que se puede deshacer, y hasta ahora no se podía. */}
      <RetiredSubjects />
    </div>
  )
}
