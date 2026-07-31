import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useCreateSubject, useUpdateSubject } from '../hooks/use-study'
import { createSubjectSchema, type CreateSubjectValues } from '../schemas/study.schema'
import type { Subject } from '../types/study.types'

interface SubjectFormProps {
  /** Materia a editar; si falta, el formulario crea una nueva. */
  readonly subject?: Subject
  readonly onSaved: () => void
  readonly onCancel: () => void
}

/** El formulario habla en horas; la base guarda minutos. */
function toHours(minutes: number | null): number | undefined {
  return minutes === null ? undefined : minutes / 60
}

/** Crear o editar una materia. Pide lo mínimo: nombre y, si acaso, objetivo. */
export function SubjectForm({ subject, onSaved, onCancel }: SubjectFormProps) {
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const save = subject ? updateSubject : createSubject

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSubjectValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: subject?.name ?? '',
      weeklyTargetHours: toHours(subject?.weekly_target_minutes ?? null),
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (subject) {
      updateSubject.mutate({ subjectId: subject.id, values }, { onSuccess: onSaved })
      return
    }
    createSubject.mutate(values, { onSuccess: onSaved })
  })

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="subject-name" label="Nombre" error={errors.name?.message}>
            <Input
              id="subject-name"
              autoFocus
              placeholder="Ej. Cálculo"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField
            id="subject-target"
            label="Objetivo semanal en horas (opcional)"
            error={errors.weeklyTargetHours?.message}
          >
            <Input
              id="subject-target"
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              placeholder="Ej. 8"
              aria-invalid={Boolean(errors.weeklyTargetHours)}
              {...register('weeklyTargetHours', {
                // Vacío es «sin objetivo», no cero horas.
                setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
              })}
            />
          </FormField>

          {save.isError ? <FormAlert>{save.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : subject ? 'Guardar cambios' : 'Crear materia'}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
