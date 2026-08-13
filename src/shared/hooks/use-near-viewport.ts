import { useEffect, useRef, useState } from 'react'

/**
 * Cuánto antes de asomar por la pantalla se da algo por «cerca».
 *
 * Con margen cero, el contenido aparecería justo al llegar y se vería el
 * cambio. Con 400 px se prepara mientras todavía está fuera, así que al llegar
 * ya está puesto.
 */
const DEFAULT_MARGIN = '400px'

/**
 * Cuánto se espera a la primera respuesta del observador antes de rendirse.
 *
 * El estándar obliga a avisar una vez nada más observar, con el estado inicial,
 * así que en un navegador sano llega en el primer fotograma. Un segundo es
 * holgura de sobra; pasado ese punto lo que hay es una avería.
 *
 * En una pestaña de fondo el navegador deja de calcular posiciones y el aviso
 * llega tarde, así que se monta todo. Sale a cuenta: nadie está mirando, y al
 * volver a la pestaña lo encuentra ya puesto.
 */
const HEALTH_CHECK_MS = 1000

/**
 * Avisa cuando un elemento se acerca a la pantalla, para no montar lo pesado
 * hasta que haga falta.
 *
 * **Sólo cambia de `false` a `true`, nunca al revés.** Desmontar lo que sale por
 * arriba parecería más eficiente, pero cambiaría la altura de la página con el
 * usuario dentro y el scroll daría saltos. Una vez montado, se queda.
 *
 * Ante la duda, pinta. Quedarse en blanco es mucho peor que pintar de más, así
 * que hay dos salidas de emergencia: sin `IntersectionObserver` —jsdom,
 * navegadores antiguos— arranca en `true`, y si el observador existe pero no
 * contesta, se le da por roto y se monta igual.
 */
export function useNearViewport<T extends Element>(rootMargin = DEFAULT_MARGIN) {
  const ref = useRef<T>(null)
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    if (isNear) return

    if (typeof IntersectionObserver === 'undefined') {
      setIsNear(true)
      return
    }

    const element = ref.current
    if (!element) return

    let answered = false

    const observer = new IntersectionObserver(
      (entries) => {
        answered = true
        if (entries.some((entry) => entry.isIntersecting)) setIsNear(true)
      },
      { rootMargin },
    )

    observer.observe(element)

    // Se comprueba que el observador conteste, no que este elemento esté cerca:
    // «aún queda lejos» es una respuesta correcta y debe seguir esperando. Lo
    // que no puede pasar es que no llegue ninguna.
    const healthCheck = setTimeout(() => {
      if (!answered) setIsNear(true)
    }, HEALTH_CHECK_MS)

    return () => {
      clearTimeout(healthCheck)
      observer.disconnect()
    }
  }, [isNear, rootMargin])

  return { ref, isNear }
}
