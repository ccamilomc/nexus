import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

interface SummaryCardProps {
  readonly to: string
  readonly label: string
  readonly Icon: LucideIcon
  readonly children: ReactNode
}

/**
 * Tarjeta de un dominio en el dashboard.
 *
 * Sólo pone el marco (título, icono y enlace); **qué se cuenta lo decide cada
 * módulo**. Así todas se ven iguales aunque cada dominio resuma lo suyo.
 */
export function SummaryCard({ to, label, Icon, children }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
        <Link
          to={to}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Abrir
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  )
}
