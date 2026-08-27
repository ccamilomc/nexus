import { describe, expect, it } from 'vitest'

import { EXERCISE_ILLUSTRATIONS } from './illustrations'

/**
 * Los dibujos que hay de verdad en el proyecto.
 *
 * Se leen con el glob de Vite y no con `node:fs` **a propósito**: `src` no tiene
 * los tipos de Node y no debe tenerlos —es código de navegador—, así que una
 * prueba que lea el disco obligaría a abrir esa puerta para todo el proyecto.
 */
const ARCHIVOS = Object.keys(import.meta.glob('/public/ilustraciones/**/*.svg'))

/** `/public/ilustraciones/bench-press/1.svg` → `bench-press`. */
const slugDe = (ruta: string) => ruta.split('/').at(-2) ?? ''

const FRAMES = [1, 2, 3]

describe('EXERCISE_ILLUSTRATIONS', () => {
  it('cada ejercicio emparejado tiene sus tres dibujos en el proyecto', () => {
    // Un slug mal escrito o una descarga que falló no se ven al programar: se
    // ven como un hueco al abrir ese ejercicio, meses después. Aquí sale en CI.
    const faltan = Object.entries(EXERCISE_ILLUSTRATIONS).flatMap(([name, slug]) =>
      FRAMES.filter(
        (frame) => !ARCHIVOS.includes(`/public/ilustraciones/${slug}/${frame}.svg`),
      ).map((frame) => `${name} → ${slug}/${frame}.svg`),
    )

    expect(faltan).toEqual([])
  })

  it('no hay dos ejercicios apuntando al mismo dibujo', () => {
    // Dos nombres con el mismo slug casi siempre es un copiar y pegar, no una
    // decisión: enseñaría la misma postura para dos movimientos distintos.
    const slugs = Object.values(EXERCISE_ILLUSTRATIONS)

    expect(slugs.length).toBe(new Set(slugs).size)
  })

  it('no sobra ningún dibujo descargado sin usar', () => {
    // Los megas que ocupan tienen que ser los que se usan. Un dibujo que no
    // apunta a ningún ejercicio es peso que nadie va a echar de menos al quitarlo.
    const usados = new Set(Object.values(EXERCISE_ILLUSTRATIONS))
    const huerfanos = [...new Set(ARCHIVOS.map(slugDe))].filter((slug) => !usados.has(slug))

    expect(huerfanos).toEqual([])
  })
})
