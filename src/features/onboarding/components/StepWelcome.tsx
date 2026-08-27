import { Sparkles } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'

interface StepWelcomeProps {
  /** El nombre que dio al registrarse, si lo dio. */
  readonly name: string | null
  readonly onNext: () => void
}

/**
 * La primera pantalla: qué es Nexus y por dónde se empieza.
 *
 * **No pide el nombre**: ya lo dio al registrarse, y volver a pedirlo en la
 * pantalla siguiente hacía sentir que la aplicación no escucha. Si lo dio, se
 * usa para saludar; si no, se saluda igual.
 */
export function StepWelcome({ name, onNext }: StepWelcomeProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {name ? `Hola, ${name}` : 'Esto es Nexus'}
        </h1>
        <p className="text-muted-foreground">
          Un solo sitio para tu entreno, tu comida, tus hábitos y tu plata. Vamos a dejarlo listo en
          un minuto.
        </p>
      </div>

      <Button className="w-full" onClick={onNext}>
        Empezar
      </Button>
    </div>
  )
}
