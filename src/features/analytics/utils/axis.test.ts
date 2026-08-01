import { describe, expect, it } from 'vitest'

import type { SeriesPoint } from '@/shared/utils'

import { hourAxis } from './axis'

function points(...minutes: (number | null)[]): SeriesPoint[] {
  return minutes.map((value, index) => ({ dateKey: `2026-07-${10 + index}`, value }))
}

describe('hourAxis', () => {
  it('ajusta el eje a las horas que rodean a los datos', () => {
    // Entre 6 h 9 y 8 h 2: no tiene sentido dibujar desde cero.
    const axis = hourAxis(points(369, 482, 420))

    expect(axis?.domain).toEqual([360, 540])
  })

  it('las marcas caen en horas exactas', () => {
    const axis = hourAxis(points(369, 482, 420))

    // 6 h, 7 h, 8 h, 9 h — nunca un 2 h 30 que se etiquetaría como «3 h».
    expect(axis?.ticks).toEqual([360, 420, 480, 540])
    expect(axis?.ticks.every((tick) => tick % 60 === 0)).toBe(true)
  })

  it('deja margen arriba para que el pico no toque el borde', () => {
    const axis = hourAxis(points(480))

    expect(axis?.domain[1]).toBeGreaterThan(480)
  })

  it('ignora los días sin registro', () => {
    // Si los huecos contaran como cero, el eje arrancaría en cero y volvería a
    // aplastar la línea. Sólo cuentan los días con dato.
    const axis = hourAxis(points(null, 420, null))

    expect(axis?.domain[0]).toBe(420)
  })

  it('sin ningún dato no hay eje que ajustar', () => {
    expect(hourAxis(points(null, null))).toBeNull()
    expect(hourAxis([])).toBeNull()
  })

  it('con un rango amplio no amontona las marcas', () => {
    const axis = hourAxis(points(60, 720))

    expect(axis?.ticks.length).toBeLessThanOrEqual(6)
  })

  it('nunca baja de cero', () => {
    expect(hourAxis(points(10))?.domain[0]).toBe(0)
  })
})
