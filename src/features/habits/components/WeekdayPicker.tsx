import { cn } from '@/shared/lib/utils'

interface WeekdayPickerProps {
  readonly value: readonly number[]
  readonly onChange: (weekdays: number[]) => void
}

/** Lunes a domingo, con la numeración que guarda la base (1 = lunes). */
const DAYS = [
  { number: 1, initial: 'L', name: 'lunes' },
  { number: 2, initial: 'M', name: 'martes' },
  { number: 3, initial: 'X', name: 'miércoles' },
  { number: 4, initial: 'J', name: 'jueves' },
  { number: 5, initial: 'V', name: 'viernes' },
  { number: 6, initial: 'S', name: 'sábado' },
  { number: 7, initial: 'D', name: 'domingo' },
] as const

/**
 * Qué días toca un hábito.
 *
 * **Ninguno marcado significa todos los días**, y la pantalla lo dice en voz
 * alta: sin esa frase, siete casillas vacías se leen como «no toca nunca» y
 * quien sólo quiere un hábito diario acabaría marcando los siete a mano.
 *
 * Empieza en lunes, como el resto de la aplicación, y no en domingo: el
 * calendario del Dashboard y el objetivo semanal de estudio ya cuentan así.
 */
export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  const toggle = (number: number) => {
    onChange(value.includes(number) ? value.filter((day) => day !== number) : [...value, number])
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map(({ number, initial, name }) => {
          const isOn = value.includes(number)

          return (
            <button
              key={number}
              type="button"
              onClick={() => toggle(number)}
              aria-pressed={isOn}
              aria-label={name}
              className={cn(
                'h-11 w-11 rounded-lg border text-sm font-medium transition-colors sm:h-10 sm:w-10',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isOn
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent',
              )}
            >
              {initial}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length === 0
          ? 'Sin marcar ninguno, el hábito es de todos los días.'
          : 'Los días que no marques no cuentan: ni suman ni rompen la racha.'}
      </p>
    </div>
  )
}
