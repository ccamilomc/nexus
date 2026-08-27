import { Sparkles } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

interface StepWelcomeProps {
  readonly name: string
  readonly onNameChange: (name: string) => void
  readonly onNext: () => void
}

/**
 * La primera pantalla: qué es esto y cómo te llamas.
 *
 * El nombre se pide **antes que nada y sin explicar por qué**, porque es la
 * pregunta más fácil que existe: contestarla cuesta cero y deja a quien entra
 * dentro del proceso en vez de mirándolo desde fuera. También se puede dejar
 * vacío.
 */
export function StepWelcome({ name, onNameChange, onNext }: StepWelcomeProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Esto es Nexus</h1>
        <p className="text-muted-foreground">
          Un solo sitio para tu entreno, tu comida, tus hábitos y tu plata. Vamos a dejarlo listo en
          un minuto.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onboarding-nombre">¿Cómo te llamas?</Label>
        <Input
          id="onboarding-nombre"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Tu nombre"
          autoComplete="given-name"
        />
      </div>

      <Button className="w-full" onClick={onNext}>
        Empezar
      </Button>
    </div>
  )
}
