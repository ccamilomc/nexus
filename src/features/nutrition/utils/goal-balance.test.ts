import { describe, expect, it } from 'vitest'

import { caloriesFromMacros, checkGoalBalance } from './goal-balance'

describe('caloriesFromMacros', () => {
  it('usa 4, 4 y 9 kcal por gramo', () => {
    expect(caloriesFromMacros(10, 10, 10)).toBe(170)
  })
})

describe('checkGoalBalance', () => {
  it('no dice nada cuando el reparto cuadra', () => {
    // 150×4 + 200×4 + 65×9 = 1985, contra 2000: dentro de lo razonable.
    expect(checkGoalBalance(2000, 150, 200, 65)).toBeNull()
  })

  it('avisa cuando los macros piden mucho más que las calorías', () => {
    // Dos metas que no se pueden cumplir a la vez.
    const result = checkGoalBalance(2000, 200, 300, 100)

    expect(result?.fromMacros).toBe(2900)
    expect(result?.difference).toBe(900)
  })

  it('avisa también cuando se quedan cortos', () => {
    const result = checkGoalBalance(2500, 100, 100, 40)

    expect(result?.difference).toBeLessThan(0)
  })

  it('aguanta los redondeos sin dar la lata', () => {
    // Un 5 % arriba es fibra y redondeo, no un objetivo mal puesto.
    expect(checkGoalBalance(2000, 150, 200, 70)).toBeNull()
  })

  it('calla mientras falten números por escribir', () => {
    // A medio rellenar el formulario, cualquier aviso sería ruido.
    expect(checkGoalBalance(2000, 150, 200, Number.NaN)).toBeNull()
    expect(checkGoalBalance(0, 150, 200, 65)).toBeNull()
  })
})
