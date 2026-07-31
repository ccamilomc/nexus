import { zodResolver } from '@hookform/resolvers/zod'
import { Ruler } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useSaveHeight } from '../hooks/use-health'
import type { Bmi } from '../types/health.types'
import { formatBmiValue } from '../utils/format'

interface BmiCardProps {
  readonly bmi: Bmi | null
  readonly heightCm: number | null
  /** Si ya hay algún peso registrado: sin él no hay IMC que calcular. */
  readonly hasWeight: boolean
}

const heightSchema = z.object({
  heightCm: z
    .number({ message: 'Escribe tu altura en centímetros.' })
    .min(50, 'Revisa la altura.')
    .max(260, 'Revisa la altura.'),
})

type HeightValues = z.infer<typeof heightSchema>

/**
 * El índice de masa corporal, calculado con el último peso y la altura.
 *
 * Se acompaña **siempre** de lo que es: una referencia general, no un
 * diagnóstico. No distingue músculo de grasa, y darlo a secas invita a leerlo
 * como un veredicto.
 */
export function BmiCard({ bmi, heightCm, hasWeight }: BmiCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const saveHeight = useSaveHeight()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HeightValues>({
    resolver: zodResolver(heightSchema),
    defaultValues: heightCm === null ? {} : { heightCm },
  })

  const onSubmit = handleSubmit(({ heightCm: value }) =>
    saveHeight.mutate(value, { onSuccess: () => setIsEditing(false) }),
  )

  if (!hasWeight) return null

  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <Ruler className="h-4 w-4" aria-hidden />
          Índice de masa corporal
        </h2>

        {heightCm === null || isEditing ? (
          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <p className="text-sm text-muted-foreground">
              Para calcularlo hace falta tu altura. Sólo se usa para esto.
            </p>
            <FormField id="height-cm" label="Altura (cm)" error={errors.heightCm?.message}>
              <Input
                id="height-cm"
                type="number"
                inputMode="numeric"
                placeholder="Ej. 175"
                {...register('heightCm', { valueAsNumber: true })}
              />
            </FormField>
            {saveHeight.isError ? <FormAlert>{saveHeight.error.message}</FormAlert> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={saveHeight.isPending}>
                {saveHeight.isPending ? 'Guardando…' : 'Guardar altura'}
              </Button>
              {heightCm === null ? null : (
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        ) : bmi === null ? null : (
          <>
            <p className="text-2xl font-semibold tabular-nums">
              {formatBmiValue(bmi.value)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">{bmi.category}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Es una referencia general, no un diagnóstico: no distingue músculo de grasa. Calculado
              con {heightCm} cm de altura.{' '}
              <button
                type="button"
                className="font-medium text-primary underline"
                onClick={() => setIsEditing(true)}
              >
                Corregir
              </button>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
