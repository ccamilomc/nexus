import { describe, expect, it } from 'vitest'

import { splitIntoTargets } from './macro-split'

describe('splitIntoTargets', () => {
  it('reparte 30/40/30 y devuelve gramos, no porcentajes', () => {
    const targets = splitIntoTargets(2000, 80)

    expect(targets.proteinGTarget).toBe(150) // 30 % de 2000 = 600 kcal / 4
    expect(targets.carbsGTarget).toBe(200) // 40 % = 800 / 4
    expect(targets.fatGTarget).toBe(67) // 30 % = 600 / 9
  })

  it('los macros suman las calorías del objetivo', () => {
    // Si no cuadran, la pantalla de nutrición enseñaría un objetivo que se
    // contradice consigo mismo.
    const t = splitIntoTargets(2500, 80)
    const suma = t.proteinGTarget * 4 + t.carbsGTarget * 4 + t.fatGTarget * 9

    expect(Math.abs(suma - 2500)).toBeLessThan(10)
  })

  it('el agua sale del peso, redondeada a un cuarto de litro', () => {
    expect(splitIntoTargets(2000, 90).waterMlTarget).toBe(3250) // 90 × 35 = 3150
    expect(splitIntoTargets(2000, 60).waterMlTarget).toBe(2000) // 60 × 35 = 2100
  })

  it('sin peso propone dos litros en vez de no proponer nada', () => {
    expect(splitIntoTargets(2000, null).waterMlTarget).toBe(2000)
  })

  it('deja las calorías tal cual llegan', () => {
    expect(splitIntoTargets(2540, 90).caloriesTarget).toBe(2540)
  })
})
