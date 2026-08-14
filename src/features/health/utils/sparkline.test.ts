import { describe, expect, it } from 'vitest'

import { buildSparkline, toPolylinePoints } from './sparkline'

describe('buildSparkline', () => {
  it('sin recorrido no hay línea que dibujar', () => {
    expect(buildSparkline([], 100, 40)).toEqual([])
    expect(buildSparkline([90], 100, 40)).toEqual([])
  })

  it('reparte los puntos a lo ancho, del primero al último', () => {
    const points = buildSparkline([1, 2, 3], 100, 40)

    expect(points.map(({ x }) => x)).toEqual([0, 50, 100])
  })

  it('el valor más alto queda arriba y el más bajo abajo', () => {
    // En SVG la `y` crece hacia abajo, que es justo al revés de como se lee.
    const points = buildSparkline([90, 92, 91], 100, 40)

    expect(points[0]?.y).toBe(40)
    expect(points[1]?.y).toBe(0)
    expect(points[2]?.y).toBe(20)
  })

  it('ajusta la escala al recorrido de los valores, no al cero', () => {
    // Entre 89 y 92 kg, un eje desde cero dejaría la línea plana.
    const points = buildSparkline([89, 92], 100, 40)

    expect(points[0]?.y).toBe(40)
    expect(points[1]?.y).toBe(0)
  })

  it('con todos los valores iguales traza una recta por el medio', () => {
    // El recorrido es cero: dividir por él daría NaN y no se dibujaría nada.
    const points = buildSparkline([90, 90, 90], 100, 40)

    expect(points.map(({ y }) => y)).toEqual([20, 20, 20])
    expect(points.every(({ y }) => Number.isFinite(y))).toBe(true)
  })
})

describe('toPolylinePoints', () => {
  it('deja los puntos como los espera el SVG', () => {
    expect(toPolylinePoints(buildSparkline([1, 2], 100, 40))).toBe('0,40 100,0')
  })
})
