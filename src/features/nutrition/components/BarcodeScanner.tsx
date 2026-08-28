import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { createBarcodeDetector } from '../utils/barcode-detector'

interface BarcodeScannerProps {
  readonly onDetected: (barcode: string) => void
  readonly onCancel: () => void
}

/** Cada cuánto se mira la imagen. Diez veces por segundo sobra y no calienta. */
const INTERVALO_MS = 100

type Estado = 'pidiendo' | 'mirando' | 'sin-camara'

/**
 * La cámara buscando un código de barras.
 *
 * **Se apaga sola en cuanto encuentra uno**, y también al desmontarse: dejar la
 * cámara encendida después de usarla es de las cosas que peor sientan en una
 * aplicación, y en el teléfono además gasta batería.
 *
 * El aviso de «apunta al código» está por algo: la cámara trasera enfoca a
 * palmo y medio, y el fallo más común es acercar tanto el paquete que la imagen
 * sale borrosa.
 */
export function BarcodeScanner({ onDetected, onCancel }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [estado, setEstado] = useState<Estado>('pidiendo')

  useEffect(() => {
    const detector = createBarcodeDetector()
    let stream: MediaStream | null = null
    let temporizador: ReturnType<typeof setInterval> | null = null
    // Sin esto, un desmontaje a mitad de la promesa de la cámara dejaba el
    // stream encendido y sin nadie que lo apagara.
    let cancelado = false

    const apagar = () => {
      if (temporizador !== null) clearInterval(temporizador)
      stream?.getTracks().forEach((track) => {
        track.stop()
      })
    }

    async function empezar() {
      if (!detector) {
        setEstado('sin-camara')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // La de atrás: nadie escanea un paquete con la cámara de los selfis.
          video: { facingMode: 'environment' },
        })
      } catch {
        // Puede ser que lo haya denegado, que no haya cámara o que el navegador
        // lo bloquee por no ir en HTTPS. Para el usuario es el mismo callejón.
        if (!cancelado) setEstado('sin-camara')
        return
      }

      if (cancelado) {
        apagar()
        return
      }

      const video = videoRef.current
      if (!video) {
        apagar()
        return
      }

      video.srcObject = stream
      await video.play().catch(() => undefined)
      setEstado('mirando')

      temporizador = setInterval(() => {
        void (async () => {
          try {
            const codigos = await detector.detect(video)
            const primero = codigos[0]?.rawValue
            if (primero) {
              apagar()
              onDetected(primero)
            }
          } catch {
            // Un fotograma que no se puede leer no es un error: se prueba con el
            // siguiente, diez veces por segundo.
          }
        })()
      }, INTERVALO_MS)
    }

    void empezar()

    return () => {
      cancelado = true
      apagar()
    }
  }, [onDetected])

  return (
    <div className="space-y-3">
      {estado === 'sin-camara' ? (
        <FormAlert>
          No se pudo abrir la cámara. Revisa el permiso en el navegador, o escribe los datos a mano.
        </FormAlert>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-black">
          {/* `muted` y `playsInline` no son adorno: sin ellos iOS abre el vídeo
              a pantalla completa y Android no deja reproducir sin gesto. */}
          <video
            ref={videoRef}
            className="aspect-[4/3] w-full object-cover"
            muted
            playsInline
            aria-label="Cámara buscando un código de barras"
          />
        </div>
      )}

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {estado === 'pidiendo'
          ? 'Pidiendo permiso para la cámara…'
          : estado === 'mirando'
            ? 'Apunta al código de barras, a un palmo del paquete.'
            : 'Sin cámara no se puede escanear.'}
      </p>

      <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
        <X aria-hidden />
        Cancelar
      </Button>
    </div>
  )
}
