import { describe, expect, it } from 'vitest'

import { blockProgress } from './study-block'

describe('blockProgress', () => {
  it('dice lo que queda del bloque', () => {
    // Diez minutos de un bloque de 25: quedan quince.
    const progress = blockProgress(10 * 60, 25)

    expect(progress).toMatchObject({ remainingSeconds: 15 * 60, overtimeSeconds: 0, isDone: false })
    expect(progress?.percent).toBe(40)
  })

  it('sin objetivo no hay bloque que medir', () => {
    // El rato de estudio abierto de siempre sigue siendo válido.
    expect(blockProgress(600, null)).toBeNull()
  })

  it('al cumplirse no queda nada y se dice', () => {
    const progress = blockProgress(25 * 60, 25)

    expect(progress).toMatchObject({ remainingSeconds: 0, overtimeSeconds: 0, isDone: true })
  })

  it('seguir estudiando cuenta el tiempo de más', () => {
    // El cronómetro no se para al cumplir: quien está en mitad de un problema
    // no quiere que le corten.
    const progress = blockProgress(30 * 60, 25)

    expect(progress).toMatchObject({ remainingSeconds: 0, overtimeSeconds: 5 * 60, isDone: true })
  })

  it('la barra se queda en 100, no sigue creciendo', () => {
    // Una barra al 200 % deja de decir «vas por aquí» y sólo dice «te pasaste»,
    // que ya se dice con palabras.
    expect(blockProgress(50 * 60, 25)?.percent).toBe(100)
  })

  it('un objetivo de cero o negativo no es un bloque', () => {
    expect(blockProgress(600, 0)).toBeNull()
    expect(blockProgress(600, -25)).toBeNull()
  })
})
