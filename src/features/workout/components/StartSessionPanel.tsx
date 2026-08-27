import { CalendarPlus, Dumbbell, Play } from 'lucide-react'
import { useState } from 'react'

import { useNow } from '@/core/time'
import { EmptyState, FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { useStartSession, useStartSessionFromRoutineDay } from '../hooks/use-active-session'
import { useRoutineDays } from '../hooks/use-routine-days'
import { useSessionHistory } from '../hooks/use-session-history'
import { formatSessionDate } from '../utils/format'
import { buildNextWorkout } from '../utils/next-workout'
import { PastSessionForm } from './PastSessionForm'

/** Cómo se dice el tiempo que hace, sin fingir precisión. */
function describeGap(daysSince: number | null, lastTrainedAt: string | null, now: Date): string {
  if (daysSince === null || lastTrainedAt === null) {
    return 'Todavía no has registrado ningún entrenamiento.'
  }
  if (daysSince === 0) return 'Ya entrenaste hoy.'
  if (daysSince === 1) return 'La última vez fue ayer.'

  return `Hace ${daysSince} días que no entrenas · ${formatSessionDate(lastTrainedAt, now)}`
}

/**
 * Punto de entrada del módulo cuando no hay ningún entrenamiento en curso.
 *
 * **Dice cuánto hace y qué toca.** Son las dos preguntas que uno trae al llegar
 * al gimnasio, y la pantalla las tenía guardadas sin usarlas: abría con «¿Listo
 * para entrenar?» y nada más.
 *
 * **Dos caminos para empezar, y el segundo no es un adorno.** No siempre se
 * entrena con el teléfono delante: se va sin él, se queda sin batería o el
 * gimnasio no tiene cobertura. Sin la segunda opción ese día se perdía.
 */
export function StartSessionPanel() {
  const startSession = useStartSession()
  const startFromDay = useStartSessionFromRoutineDay()
  const { data: history } = useSessionHistory()
  const { data: routineDays } = useRoutineDays()
  const now = useNow()
  const [isAddingPast, setIsAddingPast] = useState(false)

  if (isAddingPast) return <PastSessionForm onCancel={() => setIsAddingPast(false)} />

  const { lastTrainedAt, daysSince, suggestedDay } = buildNextWorkout(
    history ?? [],
    routineDays ?? [],
    now,
  )
  const isBusy = startSession.isPending || startFromDay.isPending

  return (
    <div className="space-y-3">
      <EmptyState
        icon={Dumbbell}
        title={suggestedDay ? `Te toca ${suggestedDay.dayName}` : '¿Listo para entrenar?'}
        description={describeGap(daysSince, lastTrainedAt, now)}
        action={
          <div className="flex flex-col items-center gap-2">
            {/* Con rutina, lo primero es seguirla: es lo que se venía a hacer.
                Entrenar suelto sigue estando, un toque más allá. */}
            {suggestedDay ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  disabled={isBusy}
                  onClick={() => startFromDay.mutate(suggestedDay.id)}
                >
                  <Play aria-hidden />
                  {startFromDay.isPending ? 'Iniciando…' : `Empezar ${suggestedDay.dayName}`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => startSession.mutate()}
                >
                  Entrenar sin rutina
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="lg"
                disabled={isBusy}
                onClick={() => startSession.mutate()}
              >
                <Play aria-hidden />
                {startSession.isPending ? 'Iniciando…' : 'Iniciar entrenamiento'}
              </Button>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingPast(true)}>
              <CalendarPlus aria-hidden />
              Apuntar uno que ya hice
            </Button>
          </div>
        }
      />

      {startSession.isError ? <FormAlert>{startSession.error.message}</FormAlert> : null}
      {startFromDay.isError ? <FormAlert>{startFromDay.error.message}</FormAlert> : null}
    </div>
  )
}
