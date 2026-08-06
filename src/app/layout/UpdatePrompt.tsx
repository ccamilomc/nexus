import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from '@/shared/components/ui/button'

/**
 * Registra el service worker y avisa cuando hay una versión nueva.
 *
 * **Va en la raíz de la aplicación, no dentro del cascarón.** El cascarón sólo
 * se monta con la sesión iniciada, así que registrarlo ahí dejaba sin service
 * worker a quien todavía no ha entrado: justo el caso en que hace falta, porque
 * es lo que permite abrir la aplicación sin señal. Se descubrió probando el
 * build servido, donde no hay auto-login y la primera pantalla es la de entrar.
 *
 * La actualización **no se aplica sola** (`registerType: 'prompt'`). Recargar
 * por sorpresa a media serie en el gimnasio, o con un formulario a medio
 * llenar, se lleva por delante lo que se estuviera haciendo; el diseño pide
 * actualizaciones controladas (docs/13) y esto es lo que las controla.
 *
 * Tampoco insiste: se puede cerrar y la versión nueva esperará a la próxima
 * vez. Lo que hay en pantalla sigue funcionando.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  // Aunque no haya nada que avisar, el hook de arriba ya hizo su trabajo: dejar
  // el service worker registrado.
  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-md border border-border bg-card px-3 py-2 text-center text-xs shadow-lg lg:bottom-4"
    >
      <span className="font-medium">Hay una versión nueva de Nexus.</span>
      <span className="flex gap-2">
        <Button type="button" size="sm" onClick={() => void updateServiceWorker(true)}>
          Actualizar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
          Ahora no
        </Button>
      </span>
    </div>
  )
}
