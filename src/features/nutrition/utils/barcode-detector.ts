/**
 * El lector de códigos de barras del propio navegador.
 *
 * **Sin ninguna dependencia.** Chrome en Android trae `BarcodeDetector` nativo,
 * que es donde se va a usar esto. Safari en iPhone **no lo tiene** y haría falta
 * una librería de unos 40 KB; hasta que alguien lo necesite, no se añade: el
 * botón simplemente no se ofrece donde no puede funcionar, que es mejor que
 * ofrecerlo y que falle.
 *
 * TypeScript todavía no declara esta API, así que se describe aquí lo poco que
 * se usa. La comprobación de `typeof === 'function'` **es** la detección de
 * capacidad: no hay forma de saberlo sin mirar el global.
 */

export interface DetectedBarcode {
  readonly rawValue: string
}

export interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<readonly DetectedBarcode[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { readonly formats?: readonly string[] }): BarcodeDetectorLike
}

/**
 * Los formatos que llevan los paquetes de comida.
 *
 * Limitarlos ayuda al detector y evita leer por error un QR de una etiqueta de
 * al lado. `ean_13` es el de casi todo; `ean_8` va en los paquetes pequeños y
 * `upc_a`/`upc_e` en lo importado de Estados Unidos.
 */
const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const

function constructor(): BarcodeDetectorConstructor | null {
  const candidate = (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector
  // El `as` es inevitable: se está tipando un global que el navegador declara y
  // TypeScript no. La comprobación de arriba es lo que lo hace seguro.
  return typeof candidate === 'function' ? (candidate as BarcodeDetectorConstructor) : null
}

/** Si este navegador puede escanear. Decide si el botón se ofrece siquiera. */
export function canScanBarcodes(): boolean {
  return constructor() !== null && typeof navigator.mediaDevices?.getUserMedia === 'function'
}

/** Un detector listo para usar, o `null` si el navegador no puede. */
export function createBarcodeDetector(): BarcodeDetectorLike | null {
  const Ctor = constructor()
  return Ctor ? new Ctor({ formats: FORMATOS }) : null
}
