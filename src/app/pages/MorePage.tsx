import { Link } from 'react-router-dom'

import { NAV_GROUPS } from '@/app/router/navigation'
import { PageHeader } from '@/shared/components/layout'
import { cn } from '@/shared/lib/utils'

/**
 * Índice de módulos. Da acceso en móvil a lo que no cabe en la barra inferior.
 *
 * Se agrupa igual que la barra lateral —mismos títulos, mismo orden— para que
 * quien use la aplicación en el teléfono y en el portátil aprenda una sola
 * estructura, no dos.
 */
export function MorePage() {
  return (
    <>
      <PageHeader title="Módulos" description="Todo lo que Nexus organiza por ti." />

      <div className="space-y-6">
        {NAV_GROUPS.map((group, index) => (
          <section key={group.title ?? `sin-titulo-${index}`} aria-label={group.title ?? undefined}>
            {group.title ? (
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h2>
            ) : null}

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.items.map(({ to, label, description, Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      'flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card',
                      'transition-colors duration-fast ease-out hover:bg-accent',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{label}</span>
                      <span className="block text-sm text-muted-foreground">{description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
