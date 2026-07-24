import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

import { SUMMARY_ITEMS } from '../constants/dashboard-items'

/** Resumen por dominio. Hoy con estado vacío; se llenará al llegar cada feature. */
export function DomainSummary() {
  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="mb-3 text-sm font-medium text-muted-foreground">
        Tu día
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUMMARY_ITEMS.map(({ to, label, Icon, emptyLabel }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
              <Link
                to={to}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Abrir
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
