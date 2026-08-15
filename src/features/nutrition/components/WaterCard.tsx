import { Droplet, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { FormAlert, Skeleton } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Progress } from '@/shared/components/ui/progress'
import { calculateProgress, formatTime } from '@/shared/utils'

import { WATER_QUICK_AMOUNTS } from '../constants/nutrition.constants'
import { useActiveGoal, useAddWater, useDayWater, useRemoveWater } from '../hooks/use-nutrition'
import { formatVolumeMl } from '../utils/format'

/** Cinco litros de un trago no existen: es un dedazo, no una jarra. */
const MAX_WATER_ML = 5000

interface WaterCardProps {
  readonly date: Date
}

/** Agua bebida en el día, con atajos para registrar de un toque. */
export function WaterCard({ date }: WaterCardProps) {
  const { data, isPending, isError, error } = useDayWater(date)
  const { data: goal } = useActiveGoal()
  const addWater = useAddWater(date)
  const removeWater = useRemoveWater()
  const [isAdding, setIsAdding] = useState(false)
  const [custom, setCustom] = useState('')

  const progress = goal ? calculateProgress(data?.totalMl ?? 0, goal.water_ml_target) : null

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
              {progress ? (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {formatVolumeMl(progress.target)}
                </span>
              ) : null}
            </p>
          )}
        </div>

        {progress ? (
          <div className="space-y-1">
            <Progress
              value={progress.percent}
              label={`Agua: ${progress.percent}% del objetivo`}
              tone={progress.isExceeded ? 'warning' : 'default'}
            />
            <p className="text-xs text-muted-foreground">
              {progress.remaining === 0
                ? '¡Objetivo cumplido!'
                : `Te faltan ${formatVolumeMl(progress.remaining)}.`}
            </p>
          </div>
        ) : null}

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

          {/* No todo lo que se bebe es un vaso o una botella: hay termos, jarras
              y botellas de litro y medio. Sin esto había que dar cuatro toques
              al vaso y aun así no cuadraba. */}
          {isAdding ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={addWater.isPending}
              onClick={() => setIsAdding(true)}
            >
              Otra cantidad
            </Button>
          )}
        </div>

        {isAdding ? (
          <form
            className="flex items-end gap-2"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              const ml = Number(custom)
              if (!Number.isFinite(ml) || ml <= 0 || ml > MAX_WATER_ML) return

              addWater.mutate(ml, {
                onSuccess: () => {
                  setCustom('')
                  setIsAdding(false)
                },
              })
            }}
          >
            <div className="w-32">
              <FormField id="water-custom" label="Mililitros">
                <Input
                  id="water-custom"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_WATER_ML}
                  step={50}
                  autoFocus
                  placeholder="Ej. 750"
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                />
              </FormField>
            </div>
            <Button type="submit" size="sm" disabled={addWater.isPending || custom === ''}>
              <Plus aria-hidden />
              Añadir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCustom('')
                setIsAdding(false)
              }}
            >
              Cancelar
            </Button>
          </form>
        ) : null}

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
