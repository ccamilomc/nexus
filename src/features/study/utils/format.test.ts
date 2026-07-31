import { describe, expect, it } from 'vitest'

import { formatMinutes } from './format'

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

  it('varias horas justas', () => {
    expect(formatMinutes(180)).toBe('3 h')
  })

  it('sin tiempo dice cero minutos, no vacío', () => {
    expect(formatMinutes(0)).toBe('0 min')
  })

  it('un minuto de más sobre la hora se ve', () => {
    expect(formatMinutes(61)).toBe('1 h 1 min')
  })
})
