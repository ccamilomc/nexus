import { toAppError } from '@/core/error'

import { localCatalogRepository } from '../repositories/local-catalog.repository'
import { openFoodFactsRepository } from '../repositories/open-food-facts.repository'
import { findByBarcode, toScannedFood } from '../utils/local-catalog'
import { type ScanResult, toScanResult } from '../utils/scanned-food'

/**
 * Qué hacer con un código de barras escaneado.
 *
 * La regla que vive aquí es corta pero es la del negocio: **lo que llega de
 * fuera no entra al catálogo**, se traduce a un desenlace que la pantalla sabe
 * contar y se enseña en el formulario de siempre para que el usuario lo revise.
 * Nexus no da por buena una cifra que no ha comprobado nadie.
 *
 * **Primero se mira dentro y después fuera.** El catálogo colombiano que Nexus
 * lleva encima resuelve la mayoría de los escaneos del súper sin salir a
 * internet, que es donde peor anda la señal; sólo lo que no esté ahí se le
 * pregunta a Open Food Facts. Un producto de dentro y uno de fuera acaban en el
 * mismo formulario: la procedencia no cambia lo que hay que revisar.
 */
export const barcodeService = {
  async lookup(barcode: string): Promise<ScanResult> {
    try {
      const local = findByBarcode(await localCatalogRepository.load(), barcode)
      if (local) return { kind: 'listo', food: toScannedFood(local) }

      return toScanResult(await openFoodFactsRepository.findByBarcode(barcode))
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Buscar un producto por su nombre, dentro del catálogo que Nexus lleva.
   *
   * No sale a internet a propósito: el buscador de Open Food Facts no admite
   * llamadas desde el navegador, así que **o es local o no hay búsqueda**.
   */
  async search(query: string) {
    try {
      const { searchCatalog } = await import('../utils/local-catalog')

      return searchCatalog(await localCatalogRepository.load(), query)
    } catch (error) {
      throw toAppError(error)
    }
  },
}
