import { useMutation } from '@tanstack/react-query'

import type { AppError } from '@/core/error'

import { barcodeService } from '../services/barcode.service'
import type { ScanResult } from '../utils/scanned-food'

/**
 * Busca un código de barras en Open Food Facts.
 *
 * Es una mutación y no una consulta a propósito: la dispara un gesto —acabas de
 * escanear— y no hay nada que refrescar ni que mantener en caché. **Tampoco se
 * encola sin red**: consultar una base de fuera dentro de tres horas no sirve de
 * nada; sin conexión se escriben los datos a mano y ya está.
 */
export function useBarcodeLookup() {
  return useMutation<ScanResult, AppError, string>({
    mutationFn: (barcode) => barcodeService.lookup(barcode),
  })
}
