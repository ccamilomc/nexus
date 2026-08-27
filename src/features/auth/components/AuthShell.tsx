import type { PropsWithChildren, ReactNode } from 'react'

interface AuthShellProps extends PropsWithChildren {
  readonly title: string
  readonly subtitle?: string | undefined
  readonly footer?: ReactNode
}

/**
 * Marco visual compartido por las pantallas de acceso.
 *
 * **La marca, no un adorno.** Aquí hubo un cuadrado con unas chispas que no
 * decía nada y hacía que la aplicación pareciera otra cosa; se quitó. Lo que
 * hay ahora es el icono de verdad —el mismo que el usuario tocó para abrir— al
 * lado del nombre: quien llega necesita reconocer en un segundo que está en
 * Nexus y no en otra pestaña.
 *
 * **El icono se lee de `/favicon.svg`, no se redibuja aquí.** El nudo ya vive
 * en ese archivo; copiarlo a un componente daría una cuarta copia que se iría
 * quedando vieja. Además el service worker ya lo precachea, así que esta
 * pantalla también se ve sin señal.
 *
 * El fondo redondeado del icono es del mismo negro que `bg-background` a
 * propósito (está escrito en `docs/13`), así que aquí se funde y sólo se ve el
 * nudo.
 *
 * Todo va alineado a la izquierda y no centrado, como el resto de la
 * aplicación: todas las pantallas empiezan por el borde izquierdo, y una
 * centrada se sentía de otro sitio.
 */
export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2.5">
            {/* Decorativo: el nombre va justo al lado, así que un texto
                alternativo sólo repetiría «Nexus» al lector de pantalla. */}
            <img src="/favicon.svg" alt="" width={36} height={36} className="shrink-0" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              NE<span className="text-primary">X</span>US
            </p>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>

        {children}

        {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </main>
  )
}
