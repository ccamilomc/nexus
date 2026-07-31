import { describe, expect, it } from 'vitest'

import { formatElapsed, formatMinutes } from './format-duration'

describe('formatMinutes', () => {
  it('por debajo de una hora habla en minutos', () => {
    expect(formatMinutes(45)).toBe('45 min')
  })

  it('la hora justa no arrastra minutos', () => {
    expect(formatMinutes(60)).toBe('1 h')
  })

  it('combina horas y minutos para no obligar a hacer la cuenta', () => {
    expect(formatMinutes(135)).toBe('2 h 15 min')
  })

  it('sin tiempo dice cero minutos, no vacío', () => {
    expect(formatMinutes(0)).toBe('0 min')
  })

  it('una duración desconocida no se confunde con cero', () => {
    // `null` es una sesión en curso: aún no se sabe cuánto duró.
    expect(formatMinutes(null)).toBe('—')
  })

  it('un valor negativo no se muestra como duración', () => {
    expect(formatMinutes(-5)).toBe('—')
  })
})

describe('formatElapsed', () => {
  it('muestra minutos y segundos', () => {
    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(462)).toBe('07:42')
  })

  it('añade las horas cuando corresponde', () => {
    expect(formatElapsed(3909)).toBe('1:05:09')
  })

  it('nunca muestra tiempos negativos', () => {
    expect(formatElapsed(-10)).toBe('00:00')
  })
})
