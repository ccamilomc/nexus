import { Archive, ChevronDown, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import { FormAlert, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { cn } from '@/shared/lib/utils'

import { useDeleteSubjectForever, useRestoreSubject, useRetiredSubjects } from '../hooks/use-study'

/**
 * Las materias retiradas, con la opción de recuperarlas.
 *
 * **Retirar era irreversible desde la pantalla**: la materia desaparecía de la
 * lista y no había dónde volver a encontrarla, aunque sus horas siguieran
 * contando en los totales. El botón dice «Retirar», que suena a que se puede
 * deshacer; ahora se puede.
 *
 * Va plegado y **sólo se consulta al abrirlo**, como los hábitos archivados: es
 * algo que se mira de vez en cuando, no cada vez que se entra.
 *
 * Borrar del todo sólo se ofrece para la que nunca se usó —la que se creó con
 * una errata—: con horas estudiadas, ese tiempo se estudió de verdad y la salida
 * es dejarla retirada.
 */
export function RetiredSubjects() {
  const [isOpen, setIsOpen] = useState(false)
  const { data, isPending, isError, error } = useRetiredSubjects(isOpen)
  const restore = useRestoreSubject()
  const remove = useDeleteSubjectForever()

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
        Materias retiradas
        <ChevronDown className={cn('transition-transform', isOpen && 'rotate-180')} aria-hidden />
      </Button>

      {isOpen ? (
        <div className="mt-3">
          {isPending ? (
            <SkeletonList label="Cargando las materias retiradas" rows={2} rowClassName="h-12" />
          ) : isError ? (
            <FormAlert>{error.message}</FormAlert>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tienes materias retiradas. Al retirar una aparecerá aquí, con sus horas intactas.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.map((subject) => (
                <li
                  key={subject.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: subject.color }}
                      aria-hidden
                    />
                    <span className="truncate text-sm">{subject.name}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={restore.isPending}
                      aria-label={`Recuperar la materia ${subject.name}`}
                      onClick={() => restore.mutate(subject.id)}
                    >
                      <RotateCcw aria-hidden />
                      Recuperar
                    </Button>
                    <ConfirmButton
                      label="Borrar"
                      confirmLabel="Sí, borrar"
                      size="sm"
                      disabled={remove.isPending}
                      aria-label={`Borrar la materia ${subject.name}`}
                      onConfirm={() => remove.mutate(subject.id)}
                      className="text-muted-foreground"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {restore.isError ? <FormAlert>{restore.error.message}</FormAlert> : null}
          {remove.isError ? <FormAlert>{remove.error.message}</FormAlert> : null}
        </div>
      ) : null}
    </section>
  )
}
