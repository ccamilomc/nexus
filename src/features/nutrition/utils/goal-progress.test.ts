import { describe, expect, it } from 'vitest'

import { calculateProgress } from './goal-progress'

describe('calculateProgress', () => {
  it('calcula el porcentaje y lo que falta', () => {
    const progress = calculateProgress(1500, 2000)

    expect(progress?.percent).toBe(75)
    expect(progress?.remaining).toBe(500)
    expect(progress?.isExceeded).toBe(false)
  })

  it('limita la barra al 100 % pero avisa de que se pasó', () => {
    const progress = calculateProgress(2400, 2000)

    expect(progress?.percent).toBe(100)
    expect(progress?.remaining).toBe(0)
    expect(progress?.isExceeded).toBe(true)
    // El dato real no se oculta: se consumió lo que se consumió.
    expect(progress?.consumed).toBe(2400)
  })

  it('sin objetivo no hay nada que medir', () => {
    expect(calculateProgress(1500, 0)).toBeNull()
    expect(calculateProgress(1500, -100)).toBeNull()
  })

  it('un día sin consumir está al 0 %', () => {
    const progress = calculateProgress(0, 2000)

    expect(progress?.percent).toBe(0)
    expect(progress?.remaining).toBe(2000)
  })
})
