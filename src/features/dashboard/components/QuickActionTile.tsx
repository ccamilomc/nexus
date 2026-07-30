import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/utils'

interface QuickActionTileProps {
  readonly label: string
  readonly Icon: LucideIcon
  /** Línea pequeña bajo la etiqueta (el total de hoy, por ejemplo). */
  readonly detail?: ReactNode
}

interface QuickActionLinkProps extends QuickActionTileProps {
  readonly to: string
}

interface QuickActionButtonProps extends QuickActionTileProps {
  readonly onClick: () => void
  readonly disabled: boolean
  /** Qué hace el botón, para quien no ve el icono ni el contexto. */
  readonly ariaLabel: string
}

/**
 * Aspecto común de las acciones rápidas.
 *
 * Unas navegan y otras registran de un toque, pero se ven y se tocan igual:
 * quien las usa no debería tener que adivinar de qué tipo es cada una.
 */
const TILE_CLASS = cn(
  'flex h-full flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center',
  'transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:pointer-events-none disabled:opacity-60',
)

function TileContent({ label, Icon, detail }: QuickActionTileProps) {
  return (
    <>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-xs font-medium">{label}</span>
      {detail ? <span className="text-[10px] text-muted-foreground">{detail}</span> : null}
    </>
  )
}

/** Acción rápida que lleva a otra pantalla. */
export function QuickActionLink({ to, ...content }: QuickActionLinkProps) {
  return (
    <Link to={to} className={TILE_CLASS}>
      <TileContent {...content} />
    </Link>
  )
}

/** Acción rápida que registra ahí mismo, sin salir del panel. */
export function QuickActionButton({
  onClick,
  disabled,
  ariaLabel,
  ...content
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={TILE_CLASS}
    >
      <TileContent {...content} />
    </button>
  )
}
