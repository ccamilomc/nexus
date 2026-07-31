import { Moon, Pencil } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatMinutes, formatTime } from '@/shared/utils'

import { QUALITY_LABELS } from '../constants/sleep.constants'
import type { SleepLog } from '../types/sleep.types'

interface LastNightCardProps {
  readonly log: SleepLog
  readonly onEdit: () => void
}

/** Lo que se durmió anoche, ya registrado. */
export function LastNightCard({ log, onEdit }: LastNightCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Moon className="h-4 w-4" aria-hidden />
              Anoche
            </h2>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatMinutes(log.duration_minutes)}
            </p>
            <p className="text-sm text-muted-foreground">
              {log.bedtime ? formatTime(log.bedtime) : '—'} →{' '}
              {log.wake_time ? formatTime(log.wake_time) : '—'}
              {log.quality_rating === null ? null : ` · ${QUALITY_LABELS[log.quality_rating]}`}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            <Pencil aria-hidden />
            Corregir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
