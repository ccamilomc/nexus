import { HeartPulse } from 'lucide-react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { BmiCard } from '../components/BmiCard'
import { MetricCard } from '../components/MetricCard'
import { MetricForm } from '../components/MetricForm'
import { WeightTrendNote } from '../components/WeightTrendNote'
import { useHealthOverview } from '../hooks/use-health'
import { readingAgainstTypical } from '../utils/against-typical'

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
        {/* Sin mediciones no hay nada que consultar: el formulario se abre solo. */}
        <MetricForm defaultOpen={metrics.length === 0} />

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
                  {/* Sólo el peso lleva tendencia: es el único que se mide con la
                      frecuencia que hace falta, y el único con ruido diario que
                      justifique promediar. */}
                  <MetricCard
                    summary={summary}
                    {...(summary.type === 'weight'
                      ? {
                          note: (
                            <WeightTrendNote
                              trend={data?.weightTrend ?? null}
                              reading={readingAgainstTypical(
                                summary.latest.value,
                                data?.weightTypical ?? null,
                              )}
                            />
                          ),
                        }
                      : {})}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
