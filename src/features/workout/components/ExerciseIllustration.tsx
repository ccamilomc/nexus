import { useEffect, useState } from 'react'

import { prefersReducedMotion } from '@/shared/utils'

import { EXERCISE_ILLUSTRATIONS } from '../constants/illustrations'

interface ExerciseIllustrationProps {
  readonly name: string
}

/** Cuántos dibujos tiene cada ejercicio. */
const FRAMES = [1, 2, 3] as const

/** Cuánto dura cada postura, en milisegundos. */
const FRAME_MS = 700

/**
 * Cómo se hace un ejercicio, en tres posturas.
 *
 * **Los tres dibujos se alternan en bucle**, que es lo que convierte tres
 * posturas sueltas en un movimiento. Una sola imagen del press de banca a media
 * repetición no dice si se baja o se sube; viéndolo moverse no hace falta
 * explicarlo.
 *
 * **No van como `img` sino como máscara**, y el motivo es el tema. Los dibujos
 * son siluetas blancas sin contorno, hechas para fondo oscuro: puestas tal cual
 * desaparecen en el tema claro, y meterles un recuadro negro detrás deja un
 * agujero en medio de la pantalla. Usados como máscara sobre `currentColor`, la
 * figura se pinta con el color del texto y **se ve igual de bien en los dos
 * temas**, sin recuadro y sin decidir nada por el tema.
 *
 * Con `prefers-reduced-motion` se queda **quieto en la primera postura**: es la
 * de inicio, la que responde «¿cómo me pongo?», que es la duda más frecuente.
 *
 * Los dibujos se piden **al abrirse**, no al pintar la lista: son 26,6 MB entre
 * todos —302 ejercicios por tres cuadros cada uno— y nadie mira setenta a la
 * vez. La cifra de 5,3 MB que decía antes este comentario era de cuando había
 * un solo cuadro por ejercicio.
 */
export function ExerciseIllustration({ name }: ExerciseIllustrationProps) {
  const slug = EXERCISE_ILLUSTRATIONS[name]
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!slug || prefersReducedMotion()) return

    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % FRAMES.length)
    }, FRAME_MS)

    return () => window.clearInterval(timer)
  }, [slug])

  if (!slug) return null

  return (
    <figure className="space-y-1.5">
      <div
        role="img"
        aria-label={`Cómo se hace: ${name}`}
        className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/40 text-foreground"
      >
        {FRAMES.map((number, index) => (
          <span
            key={number}
            aria-hidden
            className={`absolute inset-0 bg-current transition-opacity duration-fast ${
              index === frame ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              maskImage: `url(/ilustraciones/${slug}/${number}.svg)`,
              WebkitMaskImage: `url(/ilustraciones/${slug}/${number}.svg)`,
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
            }}
          />
        ))}
      </div>
      <figcaption className="text-[0.7rem] leading-tight text-muted-foreground">
        Ilustración de{' '}
        <a
          href="https://bryllim.com"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Bryl Lim
        </a>{' '}
        sobre obra de Everkinetic ·{' '}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          CC BY-SA 4.0
        </a>
      </figcaption>
    </figure>
  )
}
