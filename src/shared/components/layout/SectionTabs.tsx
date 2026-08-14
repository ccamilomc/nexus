import { NavLink } from 'react-router-dom'

import { cn } from '@/shared/lib/utils'

export interface SectionTab {
  readonly to: string
  readonly label: string
  /**
   * Si sólo se activa con la ruta exacta.
   *
   * Lo lleva puesto la pestaña índice del módulo —«Hoy», «Movimientos»,
   * «Entrenar»—, cuya ruta es prefijo de todas las demás: sin esto se quedaría
   * marcada estando en cualquier otra.
   */
  readonly end?: boolean
}

interface SectionTabsProps {
  /**
   * De qué módulo son, en minúsculas: se lee como «Secciones de finanzas».
   *
   * Hace falta porque en una misma pantalla hay varias navegaciones —la lateral,
   * la de abajo y ésta—, y quien usa un lector de pantalla necesita distinguir
   * en cuál está.
   */
  readonly label: string
  readonly tabs: readonly SectionTab[]
}

function tabClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    // Estrecho en móvil para que quepan cinco pestañas sin desbordar, pero **con
    // 44 px de alto**: es lo que se pulsa con el pulgar, y se quedaban en 32.
    // El ancho se aprieta; el alto no se toca. `truncate` es la red de seguridad.
    'flex min-h-11 items-center justify-center truncate rounded-md px-2 text-center text-xs font-medium sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm',
    'transition-colors duration-fast ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  )
}

/**
 * Las secciones de un módulo, en pestañas.
 *
 * **Era el mismo componente copiado cuatro veces** —entrenamiento, nutrición,
 * estudio y finanzas—, idéntico salvo la lista y el rótulo. Ya había empezado a
 * separarse: sólo una de las cuatro copias usaba los tokens de movimiento, así
 * que la misma pestaña se atenuaba distinto según el módulo.
 */
export function SectionTabs({ label, tabs }: SectionTabsProps) {
  return (
    <nav aria-label={`Secciones de ${label}`} className="mb-6">
      <ul className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map(({ to, label: text, end = false }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink to={to} end={end} className={tabClassName}>
              {text}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
