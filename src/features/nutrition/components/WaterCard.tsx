import { Droplet, Plus, Trash2 } from 'lucide-react'

import { FormAlert, Skeleton } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

import { WATER_QUICK_AMOUNTS } from '../constants/nutrition.constants'
import { useAddWater, useDayWater, useRemoveWater } from '../hooks/use-nutrition'
import { formatTime, formatVolumeMl } from '../utils/format'

interface WaterCardProps {
  readonly date: Date
}

/** Agua bebida hoy, con atajos para registrar de un toque. */
export function WaterCard({ date }: WaterCardProps) {
  const { data, isPending, isError, error } = useDayWater(date)
  const addWater = useAddWater()
  const removeWater = useRemoveWater()

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Droplet className="h-4 w-4" aria-hidden />
            Agua
          </h2>
          {isPending ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className="text-lg font-semibold tabular-nums">
              {formatVolumeMl(data?.totalMl ?? 0)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {WATER_QUICK_AMOUNTS.map(({ ml, label }) => (
            <Button
              key={ml}
              type="button"
              variant="outline"
              size="sm"
              disabled={addWater.isPending}
              onClick={() => addWater.mutate(ml)}
            >
              <Plus aria-hidden />
              {label} · {formatVolumeMl(ml)}
            </Button>
          ))}
        </div>

        {isError ? <FormAlert>{error.message}</FormAlert> : null}
        {addWater.isError ? <FormAlert>{addWater.error.message}</FormAlert> : null}
        {removeWater.isError ? <FormAlert>{removeWater.error.message}</FormAlert> : null}

        {data && data.logs.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {data.logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-1 rounded-full bg-muted/60 py-1 pl-3 pr-1 text-xs"
              >
                <span className="tabular-nums text-muted-foreground">
                  {formatTime(log.logged_at)}
                </span>
                <span className="font-medium tabular-nums">{formatVolumeMl(log.amount_ml)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="iconSm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={removeWater.isPending}
                  aria-label={`Quitar el registro de ${formatVolumeMl(log.amount_ml)} de las ${formatTime(log.logged_at)}`}
                  onClick={() => removeWater.mutate(log.id)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
