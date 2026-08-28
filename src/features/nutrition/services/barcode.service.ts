import { toAppError } from '@/core/error'

import { openFoodFactsRepository } from '../repositories/open-food-facts.repository'
import { type ScanResult, toScanResult } from '../utils/scanned-food'

/**
 * Qué hacer con un código de barras escaneado.
 *
 * La regla que vive aquí es corta pero es la del negocio: **lo que llega de
 * fuera no entra al catálogo**, se traduce a un desenlace que la pantalla sabe
 * contar y se enseña en el formulario de siempre para que el usuario lo revise.
 * Nexus no da por buena una cifra que no ha comprobado nadie.
 */
export const barcodeService = {
  async lookup(barcode: string): Promise<ScanResult> {
    try {
      return toScanResult(await openFoodFactsRepository.findByBarcode(barcode))
    } catch (error) {
      throw toAppError(error)
    }
  },
}
