import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { createBarcodeDetector } from '../utils/barcode-detector'

interface BarcodePhotoScannerProps {
  readonly onDetected: (barcode: string) => void
  readonly onCancel: () => void
}

type Estado = 'esperando' | 'leyendo' | 'no-encontrado' | 'no-se-pudo'

/**
 * Leer el código de barras de una foto.
 *
 * **Es el camino del iPhone**, donde no hay lector nativo y la cámara en vivo
 * dentro de una aplicación instalada no es de fiar: se rompió en iOS 18, volvió
 * en la 18.1.1, y el permiso no se recuerda entre sesiones.
 *
 * Un campo de archivo con `capture` abre **la cámara de Apple**, no un visor
 * web, y no pasa por `getUserMedia`, que es lo que falla. A cambio hay un toque
 * más: apuntar, disparar, esperar. Merece la pena frente a teclear trece
 * dígitos.
 *
 * El descodificador pesa casi medio mega y **se baja al pulsar**, no al abrir
 * la pantalla. Quien nunca escanee no lo baja nunca.
 */
export function BarcodePhotoScanner({ onDetected, onCancel }: BarcodePhotoScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<Estado>('esperando')

  const leer = async (file: File) => {
    setEstado('leyendo')

    // Se cierra pase lo que pase: una imagen de doce megapíxeles retenida es
    // memoria que el teléfono no recupera hasta recargar.
    let bitmap: ImageBitmap | null = null

    try {
      const detector = await createBarcodeDetector()
      bitmap = await createImageBitmap(file)
      const [encontrado] = await detector.detect(bitmap)

      if (!encontrado) {
        setEstado('no-encontrado')
        return
      }

      onDetected(encontrado.rawValue)
    } catch {
      // Sin red la primera vez, el descodificador no llega. Es un caso real y
      // se cuenta como lo que es, no como «no se ve el código».
      setEstado('no-se-pudo')
    } finally {
      bitmap?.close()
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div>
        <p className="text-sm font-medium">Toma una foto del código de barras</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          De cerca pero enfocado, con el código entero dentro y sin doblar el paquete.
        </p>
      </div>

      {/* `capture="environment"` pide la cámara de atrás: nadie fotografía un
          paquete con la de los selfis. El campo va oculto porque su aspecto lo
          decide el navegador y no se parece al resto de la aplicación. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Se limpia para que elegir la misma foto dos veces vuelva a disparar.
          event.target.value = ''
          if (file) void leer(file)
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={estado === 'leyendo'}
          onClick={() => inputRef.current?.click()}
        >
          <Camera aria-hidden />
          {estado === 'leyendo'
            ? 'Leyendo…'
            : estado === 'esperando'
              ? 'Abrir la cámara'
              : 'Probar otra vez'}
        </Button>

        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {estado === 'no-encontrado' ? (
        <FormAlert>
          No he encontrado el código en esa foto. Prueba con más luz, o escríbelo a mano.
        </FormAlert>
      ) : null}

      {estado === 'no-se-pudo' ? (
        <FormAlert>
          No he podido preparar el lector. Si estás sin conexión, inténtalo con señal la primera
          vez.
        </FormAlert>
      ) : null}
    </div>
  )
}
