import type { LocalFood } from '../utils/local-catalog'

/**
 * El catálogo colombiano que Nexus lleva dentro.
 *
 * **Son 2.233 productos que se venden en Colombia**, sacados de Open Food Facts
 * con `npm run data:alimentos`. Están aquí y no se piden por internet por dos
 * razones que no se arreglan solas:
 *
 * 1. **El buscador por nombre de Open Food Facts no se puede llamar desde el
 *    navegador**: no manda cabecera CORS. El viejo, además, lleva caído desde
 *    abril de 2026.
 * 2. Nexus es offline first, y buscar un alimento en el súper es justo donde
 *    peor anda la señal.
 *
 * **Se carga al pedirlo y una sola vez.** Son 65 KB comprimidos que no viajan en
 * la primera visita: quien nunca busque un producto de marca no los baja nunca.
 *
 * Los datos son de Open Food Facts, con licencia ODbL. La atribución va visible
 * en la pantalla que los usa.
 */
let cache: Promise<readonly LocalFood[]> | null = null

export const localCatalogRepository = {
  /** Todo el catálogo. La segunda llamada no vuelve a bajar nada. */
  async load(): Promise<readonly LocalFood[]> {
    // La promesa se guarda, no el resultado: dos búsquedas seguidas antes de que
    // termine la primera compartirían la misma carga en vez de lanzar dos.
    cache ??= import('../data/alimentos-colombia.json').then(
      (module) => module.default as readonly LocalFood[],
    )

    return cache
  },
}
