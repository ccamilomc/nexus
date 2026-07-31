import { useState } from 'react'

import { useToday } from '@/core/time'
import { LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { LastNightCard } from '../components/LastNightCard'
import { SleepForm } from '../components/SleepForm'
import { SleepHistoryList } from '../components/SleepHistoryList'
import { useLastNight, useSleepHistory } from '../hooks/use-sleep'

/**
 * El sueño: lo de anoche y cómo han ido las últimas noches.
 *
 * Si la noche no está registrada, el formulario se muestra directamente: quien
 * entra por la mañana viene a apuntarla, no a buscar un botón.
 */
export function SleepPage() {
  const today = useToday()
  const lastNight = useLastNight(today)
  const history = useSleepHistory()
  const [isEditing, setIsEditing] = useState(false)

  if (lastNight.isPending || history.isPending) {
    return <SkeletonList label="Cargando tu sueño" rows={3} rowClassName="h-24" />
  }

  if (lastNight.isError) {
    return (
      <LoadFailure message={lastNight.error.message} onRetry={() => void lastNight.refetch()} />
    )
  }

  const log = lastNight.data ?? null
  const showForm = log === null || isEditing

  return (
    <>
      <PageHeader title="Sueño" description="Cuánto y cómo duermes." />

      <div className="space-y-4">
        {showForm ? (
          <SleepForm
            today={today}
            log={log}
            onSaved={() => setIsEditing(false)}
            onCancel={log ? () => setIsEditing(false) : undefined}
          />
        ) : (
          <LastNightCard log={log} onEdit={() => setIsEditing(true)} />
        )}

        {history.data ? <SleepHistoryList history={history.data} /> : null}
      </div>
    </>
  )
}
