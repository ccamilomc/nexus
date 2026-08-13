import { CalendarPlus, Dumbbell, Play } from 'lucide-react'
import { useState } from 'react'

import { EmptyState, FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { useStartSession } from '../hooks/use-active-session'
import { PastSessionForm } from './PastSessionForm'

/**
 * Punto de entrada del módulo cuando no hay ningún entrenamiento en curso.
 *
 * **Dos caminos, y el segundo no es un adorno.** No siempre se entrena con el
 * teléfono delante: se va sin él, se queda sin batería o el gimnasio no tiene
 * cobertura. Sin la segunda opción ese día se perdía, y era el único módulo que
 * obligaba a estar conectado mientras —estudio y sueño ya dejaban apuntar
 * después—.
 */
export function StartSessionPanel() {
  const startSession = useStartSession()
  const [isAddingPast, setIsAddingPast] = useState(false)

  if (isAddingPast) return <PastSessionForm onCancel={() => setIsAddingPast(false)} />

  return (
    <div className="space-y-3">
      <EmptyState
        icon={Dumbbell}
        title="¿Listo para entrenar?"
        description="Inicia el entrenamiento y ve registrando cada serie a medida que la haces."
        action={
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              size="lg"
              disabled={startSession.isPending}
              onClick={() => startSession.mutate()}
            >
              <Play aria-hidden />
              {startSession.isPending ? 'Iniciando…' : 'Iniciar entrenamiento'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingPast(true)}>
              <CalendarPlus aria-hidden />
              Apuntar uno que ya hice
            </Button>
          </div>
        }
      />

      {startSession.isError ? <FormAlert>{startSession.error.message}</FormAlert> : null}
    </div>
  )
}
