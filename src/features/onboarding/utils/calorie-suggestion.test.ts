import { describe, expect, it } from 'vitest'

import { suggestCalories } from './calorie-suggestion'

const HOY = new Date(2026, 7, 26)

const CUERPO = {
  weightKg: 90,
  heightCm: 175,
  birthDate: '1996-03-10',
  sex: 'male' as const,
}

describe('suggestCalories', () => {
  it('calcula con Mifflin-St Jeor y actividad ligera', () => {
    // 10·90 + 6,25·175 − 5·30 + 5 = 1848,75 en reposo; ×1,375 = 2542, a la decena.
    expect(suggestCalories(CUERPO, HOY)).toEqual({ calories: 2540, isPersonal: true })
  })

  it('sin peso o sin estatura no inventa: da la genérica y lo dice', () => {
    // Es la diferencia entre estimar y adivinar. La pantalla necesita saberlo
    // para no presentar como personal una cifra que no lo es.
    expect(suggestCalories({ ...CUERPO, weightKg: null }, HOY)).toEqual({
      calories: 2000,
      isPersonal: false,
    })
    expect(suggestCalories({ ...CUERPO, heightCm: null }, HOY)).toEqual({
      calories: 2000,
      isPersonal: false,
    })
  })

  it('sin fecha de nacimiento tampoco, porque la edad entra en la fórmula', () => {
    expect(suggestCalories({ ...CUERPO, birthDate: null }, HOY).isPersonal).toBe(false)
  })

  it('quien no declara sexo recibe una cifra igual, no un formulario bloqueado', () => {
    const sinDeclarar = suggestCalories({ ...CUERPO, sex: 'unspecified' }, HOY)

    expect(sinDeclarar.isPersonal).toBe(true)
    expect(sinDeclarar.calories).toBeGreaterThan(2000)
  })

  it('cuenta los años cumplidos, no los que se cumplen este año', () => {
    // Cumpleaños en diciembre y estamos en agosto: todavía tiene un año menos, y
    // un año de diferencia mueve la cifra.
    const antesDeCumplir = suggestCalories({ ...CUERPO, birthDate: '1996-12-10' }, HOY)
    const despues = suggestCalories({ ...CUERPO, birthDate: '1996-03-10' }, HOY)

    expect(antesDeCumplir.calories).toBeGreaterThan(despues.calories)
  })

  it('redondea a la decena: nadie come con precisión de una caloría', () => {
    expect(suggestCalories(CUERPO, HOY).calories % 10).toBe(0)
  })
})
