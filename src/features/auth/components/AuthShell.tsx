import type { PropsWithChildren, ReactNode } from 'react'

interface AuthShellProps extends PropsWithChildren {
  readonly title: string
  readonly subtitle?: string | undefined
  readonly footer?: ReactNode
}

/**
 * Marco visual compartido por las pantallas de acceso.
 *
 * **Sin icono.** Antes había un cuadrado con unas chispas encima del título:
 * decoración que no decía nada y que además hacía que la aplicación pareciera
 * otra cosa. En su lugar va **el nombre**, que es lo que de verdad hay que
 * reconocer al llegar: quien abre esta pantalla desde el teléfono necesita saber
 * en un segundo que está en Nexus y no en otra pestaña.
 *
 * El nombre va alineado a la izquierda y no centrado, como el resto de la
 * aplicación: todas las pantallas empiezan por el borde izquierdo, y una
 * centrada se sentía de otro sitio.
 */
export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Nexus</p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
        </div>

        {children}

        {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </main>
  )
}
