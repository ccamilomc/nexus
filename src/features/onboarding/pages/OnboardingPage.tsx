import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useProfile } from '@/features/profile'
import { Button } from '@/shared/components/ui/button'

import { StepBody } from '../components/StepBody'
import { StepDone } from '../components/StepDone'
import { StepGoals } from '../components/StepGoals'
import { StepModules } from '../components/StepModules'
import { StepWelcome } from '../components/StepWelcome'
import { useOnboarding } from '../hooks/use-onboarding'

/**
 * La bienvenida: cuatro pantallas como mucho, y todas se pueden saltar.
 *
 * Va **fuera del cascarón de la aplicación**, sin barra ni menú, por el mismo
 * motivo que las pantallas de acceso: aquí no hay a dónde navegar todavía, y
 * ofrecer once destinos a quien aún no sabe qué es Nexus es justo el problema
 * que esta pantalla viene a resolver.
 *
 * Por eso mismo los márgenes suman el área segura: al estar fuera del cascarón,
 * no hay nadie que aparte el «Paso 1 de 4» de la hora del teléfono ni el botón
 * «Atrás» de la barra de gestos.
 */
export function OnboardingPage() {
  const navigate = useNavigate()
  const onboarding = useOnboarding()
  const { data: profile } = useProfile()
  const { step, stepNumber, stepCount, draft, suggestion, isSaving } = onboarding

  // El nombre sale del perfil, no de un campo: se dio al registrarse y volver a
  // pedirlo aquí hacía sentir que la aplicación no escucha.
  const nombre = profile?.display_name?.trim() || null

  const leave = () => {
    void onboarding.finish(null).then(() => navigate(ROUTES.today))
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-3">
        {/* Cuántas van y cuántas quedan: sin esto, cada pantalla parece la
            antesala de otras diez y da ganas de cerrar. */}
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Paso {stepNumber} de {stepCount}
        </p>
        {step === 'done' ? null : (
          <Button variant="ghost" size="sm" onClick={leave} disabled={isSaving}>
            Saltar
          </Button>
        )}
      </div>

      <div className="flex-1">
        {step === 'welcome' ? <StepWelcome name={nombre} onNext={onboarding.next} /> : null}

        {step === 'modules' ? (
          <StepModules
            tracked={draft.tracked}
            onToggle={onboarding.toggleTracked}
            onNext={onboarding.next}
          />
        ) : null}

        {step === 'body' ? (
          <StepBody
            initial={draft.body}
            onSubmit={(values) => {
              onboarding.setBody(values)
              onboarding.next()
            }}
            onSkip={onboarding.next}
          />
        ) : null}

        {step === 'goals' ? (
          <StepGoals
            tracked={draft.tracked}
            suggestion={suggestion}
            isSaving={isSaving}
            onSubmit={(values) => {
              void onboarding.finish(values).then(onboarding.next)
            }}
            onSkip={onboarding.next}
          />
        ) : null}

        {step === 'done' ? (
          <StepDone
            name={nombre ?? ''}
            tracked={draft.tracked}
            isSaving={isSaving}
            onGo={(to) => {
              void onboarding.finish(null).then(() => navigate(to))
            }}
          />
        ) : null}
      </div>

      {step === 'welcome' || step === 'done' ? null : (
        <Button variant="ghost" onClick={onboarding.back} disabled={isSaving}>
          Atrás
        </Button>
      )}
    </main>
  )
}
