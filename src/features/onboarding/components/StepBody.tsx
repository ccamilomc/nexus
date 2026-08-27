import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'

import { bodySchema, type BodyValues } from '../schemas/onboarding.schema'

interface StepBodyProps {
  readonly initial: BodyValues | null
  readonly onSubmit: (values: BodyValues) => void
  readonly onSkip: () => void
}

/** El campo vacío es una respuesta, no un cero: se guarda como «no lo dijo». */
function toNumberOrNull(value: unknown): number | null {
  // Todo lo que no sea un número de verdad es «no lo dijo»: el campo vacío llega
  // como cadena vacía, pero un `<input type="number">` a medio escribir —«1e», un
  // signo suelto— llega como `NaN`, y eso hacía saltar «Revisa el peso» en un
  // campo que el usuario **no había tocado**. Comprobado en el navegador.
  const asNumber = Number(value)

  return value === '' || value === null || Number.isNaN(asNumber) ? null : asNumber
}

const EMPTY: BodyValues = {
  weightKg: null,
  heightCm: null,
  birthDate: null,
  sex: 'unspecified',
}

/**
 * Los datos del cuerpo, y todos se pueden dejar en blanco.
 *
 * Van los cuatro juntos en una pantalla en vez de repartidos: son preguntas de
 * la misma familia y separarlas haría sentir la bienvenida el doble de larga sin
 * quitar ni una pregunta.
 *
 * **La pantalla dice para qué sirve cada cosa.** Pedir la fecha de nacimiento y
 * el sexo sin explicar por qué, en una aplicación donde nada más los pide, se
 * siente como que se están recogiendo datos porque sí.
 */
export function StepBody({ initial, onSubmit, onSkip }: StepBodyProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BodyValues>({
    resolver: zodResolver(bodySchema),
    defaultValues: initial ?? EMPTY,
  })

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sobre ti</h1>
        <p className="text-muted-foreground">
          Con esto Nexus calcula tu IMC y te propone unas calorías. Puedes dejarlo en blanco y
          seguir igual.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Peso (kg)" id="peso" error={errors.weightKg?.message}>
          <Input
            id="peso"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="Opcional"
            {...register('weightKg', { setValueAs: toNumberOrNull })}
          />
        </FormField>

        <FormField label="Estatura (cm)" id="estatura" error={errors.heightCm?.message}>
          <Input
            id="estatura"
            type="number"
            inputMode="numeric"
            placeholder="Opcional"
            {...register('heightCm', { setValueAs: toNumberOrNull })}
          />
        </FormField>

        <FormField label="Fecha de nacimiento" id="nacimiento" error={errors.birthDate?.message}>
          <Input
            id="nacimiento"
            type="date"
            {...register('birthDate', { setValueAs: (value: string) => value || null })}
          />
        </FormField>

        <FormField label="Sexo" id="sexo" error={errors.sex?.message}>
          <Select id="sexo" {...register('sex')}>
            <option value="unspecified">Prefiero no decirlo</option>
            <option value="female">Mujer</option>
            <option value="male">Hombre</option>
            <option value="other">Otro</option>
          </Select>
        </FormField>
      </div>

      <p className="text-xs text-muted-foreground">
        La edad y el sexo entran en la fórmula de las calorías. Sin ellos la cifra sale más
        aproximada, y nada más.
      </p>

      <div className="space-y-2">
        <Button type="submit" className="w-full">
          Continuar
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onSkip}>
          Saltar esto
        </Button>
      </div>
    </form>
  )
}
