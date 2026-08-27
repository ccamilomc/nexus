import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

import type { TrackableId } from '../constants/onboarding.constants'
import { goalsSchema, type GoalsValues } from '../schemas/onboarding.schema'
import type { CalorieSuggestion } from '../utils/calorie-suggestion'

interface StepGoalsProps {
  readonly tracked: readonly TrackableId[]
  readonly suggestion: CalorieSuggestion
  readonly isSaving: boolean
  readonly onSubmit: (values: GoalsValues) => void
  readonly onSkip: () => void
}

/** Lo que duerme la mayoría de la gente, y un punto de partida razonable. */
const DEFAULT_SLEEP_HOURS = 8

/**
 * Los objetivos, propuestos y no impuestos.
 *
 * **La cifra viene puesta y se puede cambiar.** Un campo en blanco obliga a
 * buscar el dato fuera de Nexus, y ahí se pierde a la gente; una cifra fija sin
 * poder tocarla sería la aplicación decidiendo por ti, que es lo contrario de lo
 * que hace el resto.
 *
 * Se dice de dónde sale y qué se supuso: presentar una estimación como si fuera
 * un dato sería fingir una precisión que la fórmula no tiene.
 */
export function StepGoals({ tracked, suggestion, isSaving, onSubmit, onSkip }: StepGoalsProps) {
  const showCalories = tracked.includes('nutrition')
  const showSleep = tracked.includes('sleep')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalsValues>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      caloriesTarget: suggestion.calories,
      sleepHours: DEFAULT_SLEEP_HOURS,
    },
  })

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tus objetivos</h1>
        <p className="text-muted-foreground">
          Los dejamos propuestos para que no empieces en blanco. Cámbialos cuando quieras.
        </p>
      </div>

      {showCalories ? (
        <div className="space-y-2">
          <FormField label="Calorías al día" id="calorias" error={errors.caloriesTarget?.message}>
            <Input
              id="calorias"
              type="number"
              inputMode="numeric"
              {...register('caloriesTarget', { valueAsNumber: true })}
            />
          </FormField>
          <p className="text-xs text-muted-foreground">
            {suggestion.isPersonal
              ? 'Calculado con tus datos, contando actividad ligera. Si entrenas fuerte, súbelo.'
              : 'Es una cifra media: sin peso, estatura y edad no se puede calcular la tuya.'}{' '}
            Los macros se reparten 30/40/30 y se ajustan en Nutrición.
          </p>
        </div>
      ) : null}

      {showSleep ? (
        <FormField label="Horas que quieres dormir" id="sueno" error={errors.sleepHours?.message}>
          <Input
            id="sueno"
            type="number"
            inputMode="decimal"
            step="0.5"
            {...register('sleepHours', { valueAsNumber: true })}
          />
        </FormField>
      ) : null}

      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar y terminar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onSkip}
          disabled={isSaving}
        >
          Saltar esto
        </Button>
      </div>
    </form>
  )
}
