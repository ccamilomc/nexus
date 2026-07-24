import { Dumbbell, Play } from 'lucide-react'

import { EmptyState, FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { useStartSession } from '../hooks/use-active-session'

/** Punto de entrada del módulo cuando no hay ningún entrenamiento en curso. */
export function StartSessionPanel() {
  const startSession = useStartSession()

  return (
    <div className="space-y-3">
      <EmptyState
        icon={Dumbbell}
        title="¿Listo para entrenar?"
        description="Inicia el entrenamiento y ve registrando cada serie a medida que la haces."
        action={
          <Button
            type="button"
            size="lg"
            disabled={startSession.isPending}
            onClick={() => startSession.mutate()}
          >
            <Play aria-hidden />
            {startSession.isPending ? 'Iniciando…' : 'Iniciar entrenamiento'}
          </Button>
        }
      />

      {startSession.isError ? <FormAlert>{startSession.error.message}</FormAlert> : null}
    </div>
  )
}
