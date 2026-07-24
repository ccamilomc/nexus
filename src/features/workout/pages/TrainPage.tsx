import { LoadFailure, SkeletonList } from '@/shared/components/feedback'

import { ActiveSession } from '../components/ActiveSession'
import { StartSessionPanel } from '../components/StartSessionPanel'
import { useActiveSession } from '../hooks/use-active-session'

/** Pantalla principal del módulo: el entrenamiento en curso, o cómo empezar uno. */
export function TrainPage() {
  const { data, isPending, isError, error, refetch } = useActiveSession()

  if (isPending) return <SkeletonList label="Cargando tu entrenamiento" rows={3} />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  return data ? <ActiveSession detail={data} /> : <StartSessionPanel />
}
