import { Check } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

import { TRACKABLE_MODULES, type TrackableId } from '../constants/onboarding.constants'

interface StepModulesProps {
  readonly tracked: readonly TrackableId[]
  readonly onToggle: (id: TrackableId) => void
  readonly onNext: () => void
}

/**
 * Qué vas a seguir.
 *
 * **Marcar aquí no esconde nada**, y la pantalla lo dice: sirve para saltarse
 * las preguntas de lo que no vas a usar. Sin esa frase, marcar se siente como
 * una decisión difícil de deshacer y la gente marca todo por si acaso, que es
 * justo lo contrario de lo que se busca.
 */
export function StepModules({ tracked, onToggle, onNext }: StepModulesProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">¿Qué quieres seguir?</h1>
        <p className="text-muted-foreground">
          Marca lo que vayas a usar. Sirve sólo para no preguntarte de más ahora: todo sigue
          disponible en el menú.
        </p>
      </div>

      <ul className="space-y-2">
        {TRACKABLE_MODULES.map(({ id, label, Icon, promise }) => {
          const isOn = tracked.includes(id)

          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={isOn}
                onClick={() => onToggle(id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isOn ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-accent',
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isOn ? 'text-primary' : 'text-muted-foreground',
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{promise}</span>
                </span>
                {isOn ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
              </button>
            </li>
          )
        })}
      </ul>

      <Button className="w-full" onClick={onNext}>
        {tracked.length === 0 ? 'Seguir sin marcar nada' : 'Continuar'}
      </Button>
    </div>
  )
}
