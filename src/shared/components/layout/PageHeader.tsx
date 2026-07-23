interface PageHeaderProps {
  readonly title: string
  readonly description?: string
}

/**
 * Encabezado estándar de página. Responde a "¿dónde estoy?" en cada pantalla
 * (ver docs/11-ux-ui-y-diseno.md). Es agnóstico de rutas y de dominio.
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </header>
  )
}
