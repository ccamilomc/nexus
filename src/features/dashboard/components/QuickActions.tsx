import { Droplet } from 'lucide-react'

import { useQuickWater } from '@/features/nutrition'
import { FormAlert } from '@/shared/components/feedback'

import { QUICK_ACTIONS } from '../constants/dashboard-items'
import { QuickActionButton, QuickActionLink } from './QuickActionTile'

/**
 * Accesos directos a los registros más frecuentes del día.
 *
 * El agua **se registra aquí mismo**: es de un toque y es lo que más veces se
 * apunta al día, así que obligar a navegar era pedir tres pasos para uno. El
 * resto necesita elegir algo (qué comiste, qué entrenaste), así que llevan a su
 * pantalla.
 */
export function QuickActions() {
  const water = useQuickWater()

  return (
    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="mb-3 text-sm font-medium text-muted-foreground">
        Registrar rápido
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <QuickActionButton
          label="Agua"
          Icon={Droplet}
          detail={water.totalLabel ? `${water.totalLabel} hoy` : null}
          ariaLabel={`Registrar ${water.amountLabel} de agua`}
          disabled={water.isPending}
          onClick={water.add}
        />
        {QUICK_ACTIONS.map(({ to, label, Icon }) => (
          <QuickActionLink key={label} to={to} label={label} Icon={Icon} />
        ))}
      </div>

      {water.errorMessage ? (
        <div className="mt-3">
          <FormAlert>{water.errorMessage}</FormAlert>
        </div>
      ) : null}
    </section>
  )
}
