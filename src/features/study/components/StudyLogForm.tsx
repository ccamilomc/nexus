import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'

import { useLogStudy } from '../hooks/use-study'
import { logStudySchema, type LogStudyValues } from '../schemas/study.schema'
import type { Subject } from '../types/study.types'

interface StudyLogFormProps {
  readonly subjects: readonly Subject[]
}

/** Atajos con las duraciones típicas de una sesión de foco. */
const QUICK_MINUTES = [25, 50, 90]

/**
 * Registra lo que se acaba de estudiar.
 *
 * Pide sólo materia y minutos: cuantos menos campos, más veces se registra. Los
 * atajos cubren el pomodoro (25), la clase (50) y el bloque largo (90).
 */
export function StudyLogForm({ subjects }: StudyLogFormProps) {
  const logStudy = useLogStudy()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LogStudyValues>({
    resolver: zodResolver(logStudySchema),
    defaultValues: { subjectId: subjects[0]?.id ?? '' },
  })

  const onSubmit = handleSubmit((values) =>
    logStudy.mutate(values, {
      // Se conserva la materia: lo normal es seguir registrando la misma.
      onSuccess: () => reset({ subjectId: values.subjectId }),
    }),
  )

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Comparten fila desde `sm`: sueltos ocupaban 943 px cada uno para
              una materia y un número de dos cifras. En móvil se apilan. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="study-subject" label="Materia" error={errors.subjectId?.message}>
              <Select
                id="study-subject"
                aria-invalid={Boolean(errors.subjectId)}
                {...register('subjectId')}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="study-minutes" label="Minutos" error={errors.minutes?.message}>
              <Input
                id="study-minutes"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Ej. 50"
                aria-invalid={Boolean(errors.minutes)}
                {...register('minutes', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_MINUTES.map((minutes) => (
              <Button
                key={minutes}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('minutes', minutes, { shouldValidate: true })}
              >
                {minutes} min
              </Button>
            ))}
          </div>

          {logStudy.isError ? <FormAlert>{logStudy.error.message}</FormAlert> : null}

          <Button type="submit" disabled={logStudy.isPending}>
            <Plus aria-hidden />
            {logStudy.isPending ? 'Guardando…' : 'Registrar estudio'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
