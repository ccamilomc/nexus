import { HeartPulse } from 'lucide-react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { readingAgainstTypical } from '@/shared/utils'

import { BmiCard } from '../components/BmiCard'
import { MetricCard } from '../components/MetricCard'
import { MetricForm } from '../components/MetricForm'
import { WeightTrendNote } from '../components/WeightTrendNote'
import { useHealthOverview } from '../hooks/use-health'

/**
 * Cuántos vaivenes hacen rara una pesada.
 *
 * **Dos, y está medido.** Sobre 62 pesadas reales, dos vaivenes dejan fuera
 * seis —una de cada diez—, que es la frecuencia de algo que merece mirarse. Con
 * uno saldrían casi la mitad y dejaría de significar nada.
 */
const UNUSUAL_SPREADS = 2

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
                                UNUSUAL_SPREADS,
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
