import { describe, expect, it } from 'vitest'

import { calculateBmi } from './bmi'

describe('calculateBmi', () => {
  it('calcula el índice con un decimal', () => {
    // 70 kg y 1,75 m → 22,9
    expect(calculateBmi(70, 175)).toEqual({ value: 22.9, category: 'Peso normal' })
  })

  it('reconoce las categorías de la OMS', () => {
    expect(calculateBmi(50, 175)?.category).toBe('Bajo peso')
    expect(calculateBmi(80, 175)?.category).toBe('Sobrepeso')
    expect(calculateBmi(95, 175)?.category).toBe('Obesidad')
  })

  it('sin altura no inventa un índice', () => {
    // Mostrar un IMC falso sería peor que no mostrarlo.
    expect(calculateBmi(70, null)).toBeNull()
  })

  it('no acepta datos imposibles', () => {
    expect(calculateBmi(70, 0)).toBeNull()
    expect(calculateBmi(0, 175)).toBeNull()
    expect(calculateBmi(-70, 175)).toBeNull()
  })

  it('los bordes caen del lado que dice la OMS', () => {
    // 18,5 ya es peso normal; 25, sobrepeso.
    expect(calculateBmi(56.7, 175)?.category).toBe('Peso normal')
    expect(calculateBmi(76.6, 175)?.category).toBe('Sobrepeso')
  })
})
