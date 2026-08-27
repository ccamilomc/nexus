import { ArrowRight, PartyPopper } from 'lucide-react'

import { ROUTES } from '@/app/router/routes'
import { Button } from '@/shared/components/ui/button'

import { TRACKABLE_MODULES, type TrackableId } from '../constants/onboarding.constants'

interface StepDoneProps {
  readonly name: string
  readonly tracked: readonly TrackableId[]
  readonly isSaving: boolean
  /** Guarda y **luego** navega: salir antes de guardar devolvía a la bienvenida. */
  readonly onGo: (to: string) => void
}

/**
 * Por dónde empezar.
 *
 * **Es la pantalla que justifica toda la bienvenida.** El problema no era que
 * faltaran objetivos: era que quien entraba por primera vez veía un «Hoy» vacío
 * sin ninguna pista. Aquí cada módulo que marcaste trae **una acción concreta**,
 * no una descripción de lo que hace.
 *
 * **Son botones y no enlaces, a propósito.** Un enlace navega en el acto, y la
 * bienvenida todavía no había terminado de guardarse: el guardia leía un perfil
 * sin completar y devolvía aquí, al primer paso, con lo que el botón parecía no
 * hacer nada. Ahora se espera a que guarde y sólo entonces se sale.
 */
export function StepDone({ name, tracked, isSaving, onGo }: StepDoneProps) {
  const chosen = TRACKABLE_MODULES.filter(({ id }) => tracked.includes(id))
  const greeting = name.trim() ? `Listo, ${name.trim()}` : 'Listo'

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PartyPopper className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground">
          {chosen.length > 0
            ? 'Nexus se llena a medida que lo usas. Estos son tus primeros pasos:'
            : 'Entra cuando quieras y empieza por donde te sirva.'}
        </p>
      </div>

      {chosen.length > 0 ? (
        <ul className="space-y-2">
          {chosen.map(({ id, label, Icon, firstStep, to }) => (
            <li key={id}>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onGo(to)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{firstStep}</span>
                  <span className="block text-xs text-muted-foreground">En {label}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Button className="w-full" disabled={isSaving} onClick={() => onGo(ROUTES.today)}>
        {isSaving ? 'Guardando…' : 'Ir a Hoy'}
      </Button>
    </div>
  )
}
