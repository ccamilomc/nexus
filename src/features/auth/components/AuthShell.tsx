import { Sparkles } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

interface AuthShellProps extends PropsWithChildren {
  readonly title: string
  readonly subtitle?: string | undefined
  readonly footer?: ReactNode
}

/** Marco visual compartido por todas las pantallas de autenticación. */
export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{children}</div>

        {footer ? (
          <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </main>
  )
}
