// El `.wasm` se sirve desde Nexus y no desde un CDN, que es lo que trae por
// defecto la librería. Dos razones: la aplicación es offline first y pedirle un
// archivo a otro servidor la rompe justo donde no hay red, y un CDN es un
// tercero al que no le hemos pedido permiso para saber cuándo escaneas.
//
// El `?url` deja que Vite lo publique con su huella, así que la versión del
// archivo y la del paquete no pueden desincronizarse.
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

/**
 * El lector de códigos de barras, con dos caminos según lo que sepa hacer el
 * navegador.
 *
 * **Chrome en Android trae `BarcodeDetector` nativo** y no cuesta nada: ahí se
 * usa la cámara en vivo, que lee sola mientras apuntas.
 *
 * **En el iPhone no existe esa API** —ningún navegador de iOS la tiene, porque
 * todos son WebKit por dentro— y hay que descodificar con WebAssembly. Pero el
 * problema del iPhone no es sólo ese: **la cámara en vivo dentro de una
 * aplicación instalada no es de fiar**. Se rompió en iOS 18 y volvió en la
 * 18.1.1, y el permiso no se recuerda entre sesiones, así que habría que
 * concederlo cada vez.
 *
 * Por eso ahí no se copia el visor: **se toma una foto**. Un campo de archivo
 * abre la cámara de Apple —no un visor web— y no pasa por `getUserMedia`, que es
 * lo que falla. Un gesto distinto, sí, pero uno que funciona.
 *
 * TypeScript todavía no declara la API nativa, así que se describe aquí lo poco
 * que se usa. La comprobación de `typeof === 'function'` **es** la detección de
 * capacidad: no hay forma de saberlo sin mirar el global.
 */

export interface DetectedBarcode {
  readonly rawValue: string
}

export interface BarcodeDetectorLike {
  detect(source: CanvasImageSource | Blob): Promise<readonly DetectedBarcode[]>
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

/** Cómo puede escanear este navegador. */
export type ScanMode = 'live' | 'photo'

function nativeConstructor(): BarcodeDetectorConstructor | null {
  const candidate = (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector
  // El `as` es inevitable: se está tipando un global que el navegador declara y
  // TypeScript no. La comprobación de arriba es lo que lo hace seguro.
  return typeof candidate === 'function' ? (candidate as BarcodeDetectorConstructor) : null
}

/**
 * Cámara en vivo, o foto.
 *
 * Hacen falta las dos cosas para el vivo: el detector nativo **y** una cámara a
 * la que se pueda pedir vídeo. Faltando cualquiera, la foto sirve igual.
 */
export function scanMode(): ScanMode {
  const hasCamera = typeof navigator.mediaDevices?.getUserMedia === 'function'

  return nativeConstructor() !== null && hasCamera ? 'live' : 'photo'
}

/**
 * Un detector listo para usar.
 *
 * **Es asíncrono a propósito.** Donde no hay detector nativo hay que traerse el
 * descodificador —casi medio mega comprimido— y eso sólo pasa cuando alguien
 * pulsa el botón: nadie que no escanee llega a bajarlo nunca.
 */
export async function createBarcodeDetector(): Promise<BarcodeDetectorLike> {
  const Native = nativeConstructor()
  if (Native) return new Native({ formats: FORMATOS })

  const { BarcodeDetector, setZXingModuleOverrides } = await import('barcode-detector/ponyfill')

  setZXingModuleOverrides({
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? wasmUrl : `${prefix}${path}`,
  })

  return new BarcodeDetector({ formats: [...FORMATOS] })
}
