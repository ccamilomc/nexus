import { useCallback, useSyncExternalStore } from 'react'

import { logger } from '@/core/logger'

/**
 * Qué se puede ofrecer ahora mismo respecto a instalar la aplicación.
 *
 * - `installed`: ya se está usando instalada; no hay nada que ofrecer.
 * - `ready`: el navegador ofreció instalarla y hay un botón que funciona.
 * - `manual`: iOS, donde instalar es un gesto del usuario y lo único que cabe
 *   es explicarlo.
 * - `unavailable`: ni lo uno ni lo otro (Firefox, un escritorio sin soporte, o
 *   sencillamente que el navegador todavía no lo ha ofrecido).
 */
export type InstallAvailability = 'installed' | 'ready' | 'manual' | 'unavailable'

export interface InstallPrompt {
  readonly availability: InstallAvailability
  /** Abre el diálogo del navegador. Sin `ready` no hace nada. */
  readonly install: () => Promise<void>
}

/**
 * El aviso guardado, a la espera de que el usuario quiera instalarla.
 *
 * Vive en el módulo y no dentro del componente **a propósito**, por dos motivos
 * que se rompen de formas distintas:
 *
 * 1. `beforeinstallprompt` se dispara **una sola vez** y normalmente antes de
 *    que React haya montado nada. Un `useEffect` llegaría tarde.
 * 2. Un listener que naciera y muriera con un componente perdería el aviso al
 *    salir de la pantalla: la tarjeta del Dashboard se desmonta en cuanto se
 *    navega a Nutrición, y al volver ya no habría nada que ofrecer.
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null

const subscribers = new Set<() => void>()

function notify(): void {
  for (const subscriber of subscribers) subscriber()
}

// Se registra al cargar el módulo por lo dicho arriba. La guarda de `window` es
// para los tests, que corren sin navegador hasta que jsdom monta uno.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Sin esto Chromium enseña su propia barra cuando le parece. La aplicación
    // quiere decidir el momento (docs/13), y para eso hay que quedarse el aviso.
    event.preventDefault()
    deferredPrompt = event
    notify()
  })

  window.addEventListener('appinstalled', () => {
    // Da igual si se instaló desde la aplicación o desde el menú del navegador:
    // ya no hay nada que ofrecer.
    deferredPrompt = null
    notify()
  })
}

/** Si la aplicación se está usando instalada, no dentro de una pestaña. */
function isRunningInstalled(): boolean {
  // Dos comprobaciones porque son dos mundos: `display-mode` es lo estándar y
  // `navigator.standalone` es lo único que hay en iOS.
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}

/** Si el dispositivo es de los que obligan a instalar a mano. */
function isIosDevice(): boolean {
  const { userAgent, maxTouchPoints } = navigator

  return (
    /iphone|ipad|ipod/i.test(userAgent) ||
    // Desde iPadOS 13 un iPad se hace pasar por un Mac de escritorio. Lo delata
    // la pantalla táctil: ningún Mac declara más de un punto de contacto.
    (/macintosh/i.test(userAgent) && maxTouchPoints > 1)
  )
}

function getAvailability(): InstallAvailability {
  if (isRunningInstalled()) return 'installed'
  if (deferredPrompt) return 'ready'
  if (isIosDevice()) return 'manual'

  return 'unavailable'
}

function subscribe(onChange: () => void): () => void {
  subscribers.add(onChange)

  return () => {
    subscribers.delete(onChange)
  }
}

/**
 * Si se puede ofrecer instalar la aplicación, y cómo.
 *
 * El navegador decide: sólo ofrece instalar cuando la aplicación cumple sus
 * requisitos y el usuario ya ha vuelto alguna vez. Este hook no adelanta esa
 * decisión, sólo se entera de ella.
 */
export function useInstallPrompt(): InstallPrompt {
  const availability = useSyncExternalStore(
    subscribe,
    getAvailability,
    // Sin ventana no hay nada que instalar.
    () => 'unavailable' as const,
  )

  const install = useCallback(async (): Promise<void> => {
    const event = deferredPrompt

    if (!event) return

    // Se retira **antes** de esperar, no después. El diálogo tarda lo que tarde
    // el usuario en decidirse, y durante ese rato el botón seguiría en pantalla:
    // un segundo clic llamaría a `prompt()` dos veces y Chromium lo rechaza.
    // Retirándolo aquí, el botón desaparece y el caso no existe.
    deferredPrompt = null
    notify()

    try {
      await event.prompt()
    } catch (error) {
      // Si no llegó a abrirse, el aviso no se ha gastado: se devuelve para no
      // dejar la aplicación sin forma de instalarse.
      deferredPrompt = event
      notify()

      // Al usuario no se le cuenta: el diálogo es del navegador, y si algo salió
      // mal el botón sigue donde estaba. Se registra porque no debería pasar.
      logger.warn('El navegador rechazó abrir el diálogo de instalación.', { error })
    }
  }, [])

  return { availability, install }
}
