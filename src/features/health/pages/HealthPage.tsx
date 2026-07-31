import { HeartPulse } from 'lucide-react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { BmiCard } from '../components/BmiCard'
import { MetricCard } from '../components/MetricCard'
import { MetricForm } from '../components/MetricForm'
import { useHealthOverview } from '../hooks/use-health'

/** Peso y medidas: la última lectura de cada una y cuánto ha cambiado. */
export function HealthPage() {
  const { data, isPending, isError, error, refetch } = useHealthOverview()

  if (isPending)
    return <SkeletonList label="Cargando tus mediciones" rows={3} rowClassName="h-24" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  const metrics = data?.metrics ?? []
  const hasWeight = metrics.some(({ type }) => type === 'weight')

  return (
    <>
      <PageHeader title="Salud" description="Peso, medidas y cómo van cambiando." />

      <div className="space-y-4">
        <MetricForm />

        {metrics.length === 0 ? (
          <EmptyState
            icon={HeartPulse}
            title="Aún no hay mediciones"
            description="Registra tu peso o una medida y aquí verás cómo evoluciona."
          />
        ) : (
          <>
            <BmiCard
              bmi={data?.bmi ?? null}
              heightCm={data?.heightCm ?? null}
              hasWeight={hasWeight}
            />
            <ul className="grid gap-3 sm:grid-cols-2">
              {metrics.map((summary) => (
                <li key={summary.type}>
                  <MetricCard summary={summary} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
