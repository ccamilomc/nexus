import { describe, expect, it } from 'vitest'

import { stepsFor } from './steps'

describe('stepsFor', () => {
  it('sin marcar nada son tres pantallas, no cinco', () => {
    expect(stepsFor([])).toEqual(['welcome', 'modules', 'done'])
  })

  it('quien sólo sigue gastos no da su estatura ni fija calorías', () => {
    // Es el caso que hace corta la bienvenida: pedir datos que no se van a usar
    // es una razón más para cerrar la aplicación y no volver.
    expect(stepsFor(['finance'])).toEqual(['welcome', 'modules', 'done'])
  })

  it('con nutrición pide el cuerpo y los objetivos', () => {
    expect(stepsFor(['nutrition'])).toEqual(['welcome', 'modules', 'body', 'goals', 'done'])
  })

  it('salud pide el cuerpo pero no tiene objetivos que fijar', () => {
    // La estatura le hace falta para el IMC; no hay ninguna cifra que proponer.
    expect(stepsFor(['health'])).toEqual(['welcome', 'modules', 'body', 'done'])
  })

  it('sueño fija objetivo pero no necesita el cuerpo', () => {
    expect(stepsFor(['sleep'])).toEqual(['welcome', 'modules', 'goals', 'done'])
  })

  it('no repite una pantalla porque dos módulos la pidan', () => {
    expect(stepsFor(['nutrition', 'health', 'sleep'])).toEqual([
      'welcome',
      'modules',
      'body',
      'goals',
      'done',
    ])
  })

  it('la última siempre está: es la que dice por dónde empezar', () => {
    expect(stepsFor(['workout']).at(-1)).toBe('done')
  })
})
