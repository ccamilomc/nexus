import { Pencil, Target } from 'lucide-react'
import { useState } from 'react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

import { GoalForm } from '../components/GoalForm'
import { useActiveGoal } from '../hooks/use-nutrition'
import { formatCalories, formatGrams, formatVolumeMl } from '../utils/format'

/** Metas diarias: verlas y cambiarlas. */
export function GoalsPage() {
  const { data, isPending, isError, error, refetch } = useActiveGoal()
  const [isEditing, setIsEditing] = useState(false)

  if (isPending) return <SkeletonList label="Cargando tus objetivos" rows={2} rowClassName="h-24" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  if (isEditing) {
    return (
      <GoalForm
        goal={data}
        onSaved={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        icon={Target}
        title="Aún no tienes objetivos"
        description="Fíjalos y verás en «Hoy» cuánto llevas y cuánto te falta."
        action={<Button onClick={() => setIsEditing(true)}>Fijar objetivos</Button>}
      />
    )
  }

  const rows: readonly { label: string; value: string }[] = [
    { label: 'Calorías', value: formatCalories(data.calories_target) },
    { label: 'Proteína', value: formatGrams(data.protein_g_target) },
    { label: 'Carbos', value: formatGrams(data.carbs_g_target) },
    { label: 'Grasa', value: formatGrams(data.fat_g_target) },
    { label: 'Agua', value: formatVolumeMl(data.water_ml_target) },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">Objetivos diarios</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil aria-hidden />
              Cambiar
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {rows.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Al cambiarlos se guarda el objetivo anterior: así queda constancia de qué perseguías en cada
        momento.
      </p>
    </div>
  )
}
