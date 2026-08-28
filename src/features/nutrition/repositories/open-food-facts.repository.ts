import { createAppError } from '@/core/error'

import { type OffResponse, offResponseSchema } from '../utils/scanned-food'

/**
 * Único punto que habla con Open Food Facts.
 *
 * Es un repositorio como los demás —sólo trae datos, sin reglas— aunque la
 * fuente no sea Supabase: la regla del proyecto es que **el acceso a datos vive
 * en un repositorio**, y una API de fuera no es una excepción a eso.
 *
 * Open Food Facts es una base abierta y gratuita, sin clave. Pide dos cosas y se
 * cumplen las dos: identificarse con un `User-Agent` propio y no machacarla a
 * peticiones —aquí sólo se llama al escanear un código, una vez por escaneo—.
 *
 * **No se le manda nada del usuario.** Sólo viaja el código de barras del
 * paquete, que no identifica a nadie.
 */

const BASE = 'https://world.openfoodfacts.org/api/v2/product'

/** Sólo los campos que se usan: la respuesta completa trae cientos. */
const CAMPOS = 'product_name,product_name_es,brands,nutriments'

const USER_AGENT = 'Nexus - PWA personal - https://nexus-12.vercel.app'

/**
 * Si se tarda más que esto, se abandona.
 *
 * Se escanea de pie en el supermercado y con la red del móvil: esperar más que
 * unos segundos es peor que decir «no salió, escríbelo» y dejar seguir.
 */
const TIMEOUT_MS = 8000

export const openFoodFactsRepository = {
  async findByBarcode(barcode: string): Promise<OffResponse> {
    const control = new AbortController()
    const corte = setTimeout(() => {
      control.abort()
    }, TIMEOUT_MS)

    try {
      const res = await fetch(
        `${BASE}/${encodeURIComponent(barcode)}.json?fields=${encodeURIComponent(CAMPOS)}`,
        { headers: { 'User-Agent': USER_AGENT }, signal: control.signal },
      )

      // Un 404 no es un fallo: es «ese código no está», que la pantalla sabe
      // contar. Cualquier otro código sí es un problema de la petición.
      if (res.status === 404) return { status: 0 }
      if (!res.ok) {
        throw createAppError('network', 'No se pudo consultar el producto. Inténtalo otra vez.')
      }

      // La respuesta llega sin tipar: se valida antes de dejarla entrar.
      return offResponseSchema.parse(await res.json())
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw createAppError('network', 'La consulta tardó demasiado. Escribe los datos a mano.')
      }
      throw createAppError('network', 'No se pudo consultar el producto. Inténtalo otra vez.')
    } finally {
      clearTimeout(corte)
    }
  },
}
