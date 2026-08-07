import { Droplet } from 'lucide-react'

import { useQuickWater } from '@/features/nutrition'

/**
 * Registrar agua sin salir del panel.
 *
 * **Es la única acción rápida que queda, y por eso está aquí arriba.** Había
 * seis: las otras cinco no registraban nada, sólo llevaban a la pantalla del
 * dominio — exactamente lo mismo que hace el enlace «Abrir» de su tarjeta, unos
 * centímetros más abajo. Eran seis cajas grandes ocupando el mejor sitio de la
 * pantalla para ofrecer un camino que ya existía.
 *
 * El agua sí se gana el sitio: es de un toque y es lo que más veces se apunta al
 * día.
 */
export function WaterQuickAdd() {
  const water = useQuickWater()

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={water.add}
        disabled={water.isPending}
        aria-label={`Registrar ${water.amountLabel} de agua`}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium shadow-card transition-colors duration-fast ease-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
      >
        <Droplet className="h-4 w-4 text-primary" aria-hidden />
        Agua
        {water.totalLabel ? (
          <span className="tabular-nums text-muted-foreground">{water.totalLabel} hoy</span>
        ) : null}
      </button>

      {water.errorMessage ? (
        <p role="alert" className="text-xs text-destructive">
          {water.errorMessage}
        </p>
      ) : null}
    </div>
  )
}
