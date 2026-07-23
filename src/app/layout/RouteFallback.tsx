/**
 * Esqueleto mostrado mientras se carga una ruta perezosa.
 * Nunca dejamos la pantalla en blanco (docs/11-ux-ui-y-diseno.md).
 */
export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
      <span className="sr-only">Cargando contenido…</span>
    </div>
  )
}
