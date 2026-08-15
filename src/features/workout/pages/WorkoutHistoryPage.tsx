import { History } from 'lucide-react'
import { useMemo } from 'react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { SessionHistoryList } from '../components/SessionHistoryList'
import { useSessionHistory } from '../hooks/use-session-history'

/** Entrenamientos terminados, del más reciente al más antiguo. */
export function WorkoutHistoryPage() {
  const { data, isPending, isError, error, refetch, hasMore, isLoadingMore, showMore } =
    useSessionHistory()
  // Una única referencia temporal para fechar toda la lista de forma coherente.
  const now = useMemo(() => new Date(), [])

  if (isPending) return <SkeletonList label="Cargando tu historial" rows={3} rowClassName="h-28" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  if (data.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Aún no tienes entrenamientos"
        description="Cuando termines tu primera sesión, aparecerá aquí con su resumen."
      />
    )
  }

  return (
    <div className="space-y-4">
      <SessionHistoryList sessions={data} now={now} />

      {/* Sólo si puede haber más detrás: un botón que no trae nada es peor que
          no tenerlo, porque hace dudar de si faltan entrenamientos. */}
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={showMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Buscando…' : 'Ver entrenamientos anteriores'}
        </Button>
      ) : null}
    </div>
  )
}
