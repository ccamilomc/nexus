import {
  AlertTriangle,
  BookOpen,
  Droplet,
  Dumbbell,
  type LucideIcon,
  Repeat,
  X,
} from 'lucide-react'
import { useState } from 'react'

import type { PlanItemDomain, Priority, Recommendation } from '@/decision-engine'
import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { prefersReducedMotion } from '@/shared/utils'

interface RecommendationCardProps {
  readonly recommendation: Recommendation
  /** Rechaza si no se pudo guardar el descarte, y entonces la tarjeta vuelve. */
  readonly onDismiss: () => Promise<void>
  readonly isDismissing: boolean
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

/**
 * Lo que dura la salida, en milisegundos.
 *
 * **Tiene que coincidir con `--duration-base`**, y por eso está aquí escrito y
 * no calculado: leer el token del DOM para esto sería más código y una lectura
 * de estilos por cada descarte.
 */
const LEAVE_MS = 200

/** Sólo lo urgente se resalta; si todo llama la atención, nada la llama. */
const PRIORITY_STYLES: Readonly<Record<Priority, string>> = {
  critical: 'text-destructive',
  high: 'text-warning',
  medium: 'text-primary',
  low: 'text-muted-foreground',
}

/**
 * Una sugerencia del día, con su porqué y con salida.
 *
 * El motivo se muestra **siempre**: Nexus recomienda y el usuario decide, y para
 * decidir hace falta saber de dónde sale el consejo (ver docs/06).
 *
 * Y decidir incluye decir que no: se puede descartar hasta mañana. Una
 * sugerencia que vuelve después de haberla rechazado deja de ser un consejo y
 * pasa a ser una insistencia.
 *
 * **Al descartarla se va, no se esfuma.** Desaparecer de golpe deja al de al
 * lado dando un salto y sin saber qué se fue; apartándose se entiende. Es CSS y
 * los tokens de siempre, así que con `prefers-reduced-motion` se quita solo.
 */
export function RecommendationCard({
  recommendation,
  onDismiss,
  isDismissing,
}: RecommendationCardProps) {
  const { domain, priority, title, message, reason } = recommendation
  const Icon = domain ? DOMAIN_ICONS[domain] : AlertTriangle
  const [isLeaving, setIsLeaving] = useState(false)

  async function handleDismiss() {
    setIsLeaving(true)

    // Se espera a que termine de irse **antes** de guardar. Sin esta pausa no se
    // ve nada: al guardar se refresca el plan, la tarjeta desaparece del listado
    // y React la desmonta antes de que el navegador llegue a pintar el primer
    // fotograma de la transición. Comprobado en el navegador: cero eventos de
    // transición. Quien pide menos movimiento no espera, porque no hay nada que
    // esperar.
    if (!prefersReducedMotion()) {
      await new Promise((resolve) => setTimeout(resolve, LEAVE_MS))
    }

    try {
      await onDismiss()
    } catch {
      // Si no se pudo guardar, la tarjeta vuelve: irse de la pantalla sin
      // haberse descartado de verdad sería mentir, y mañana reaparecería sin
      // explicación.
      setIsLeaving(false)
    }
  }

  return (
    <Card
      className={cn(
        'transition-[opacity,transform] duration-base ease-out',
        isLeaving && 'pointer-events-none translate-x-3 opacity-0',
      )}
    >
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
          {/*
            Sin bajar la opacidad: `/80` dejaba el contraste en 3,28 sobre el
            tema claro, por debajo del 4,5 que exige WCAG AA. El motivo ya se
            distingue del mensaje por el tamaño.
          */}
          <p className="text-xs text-muted-foreground">{reason}</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isDismissing || isLeaving}
          // El nombre incluye el título: en una lista de cinco tarjetas, cinco
          // botones llamados «Descartar» no le dicen nada a un lector de
          // pantalla.
          aria-label={`Descartar «${title}» hasta mañana`}
          className="-m-1 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </CardContent>
    </Card>
  )
}
