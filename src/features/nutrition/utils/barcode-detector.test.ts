import { afterEach, describe, expect, it, vi } from 'vitest'

import { scanMode } from './barcode-detector'

/** Como se ve el navegador desde dentro: con lector nativo, con cámara, o sin. */
function navegador({ nativo, camara }: { nativo: boolean; camara: boolean }) {
  if (nativo) {
    vi.stubGlobal('BarcodeDetector', class {})
  } else {
    vi.stubGlobal('BarcodeDetector', undefined)
  }

  vi.stubGlobal('navigator', {
    mediaDevices: camara ? { getUserMedia: () => Promise.resolve() } : undefined,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('scanMode', () => {
  it('con lector nativo y cámara, lee en vivo', () => {
    // Chrome en Android, que es donde sale gratis.
    navegador({ nativo: true, camara: true })

    expect(scanMode()).toBe('live')
  })

  it('sin lector nativo, se toma una foto', () => {
    // El iPhone: ningún navegador de iOS trae la API, porque todos son WebKit.
    navegador({ nativo: false, camara: true })

    expect(scanMode()).toBe('photo')
  })

  it('con lector pero sin cámara que dé vídeo, también se toma una foto', () => {
    // Hacen falta las dos cosas para el vivo. Con una sola, el visor se quedaría
    // en negro y no habría manera de saber por qué.
    navegador({ nativo: true, camara: false })

    expect(scanMode()).toBe('photo')
  })

  it('sin nada de lo uno ni lo otro, la foto sigue sirviendo', () => {
    // Un escritorio sin cámara: el campo de archivo abre el explorador y una
    // foto ya hecha se lee igual. Antes aquí no se ofrecía nada.
    navegador({ nativo: false, camara: false })

    expect(scanMode()).toBe('photo')
  })
})
