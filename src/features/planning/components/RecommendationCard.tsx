import { AlertTriangle, BookOpen, Droplet, Dumbbell, type LucideIcon, Repeat } from 'lucide-react'

import type { PlanItemDomain, Priority, Recommendation } from '@/decision-engine'
import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

interface RecommendationCardProps {
  readonly recommendation: Recommendation
}

/** Icono por dominio, para reconocer de qué habla sin leer. */
const DOMAIN_ICONS: Readonly<Record<PlanItemDomain, LucideIcon>> = {
  workout: Dumbbell,
  nutrition: Droplet,
  study: BookOpen,
  habit: Repeat,
  sleep: AlertTriangle,
  health: AlertTriangle,
}

/** Sólo lo urgente se resalta; si todo llama la atención, nada la llama. */
const PRIORITY_STYLES: Readonly<Record<Priority, string>> = {
  critical: 'text-destructive',
  high: 'text-warning',
  medium: 'text-primary',
  low: 'text-muted-foreground',
}

/**
 * Una sugerencia del día, con su porqué.
 *
 * El motivo se muestra **siempre**: Nexus recomienda y el usuario decide, y para
 * decidir hace falta saber de dónde sale el consejo (ver docs/06).
 */
export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { domain, priority, title, message, reason } = recommendation
  const Icon = domain ? DOMAIN_ICONS[domain] : AlertTriangle

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted',
            PRIORITY_STYLES[priority],
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground/80">{reason}</p>
        </div>
      </CardContent>
    </Card>
  )
}
