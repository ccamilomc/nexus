import { describe, expect, it } from 'vitest'

import {
  formatOptionalTargets,
  formatPerformedSets,
  formatSessionDate,
  formatTargets,
  formatVolume,
  formatWeight,
} from './format'

describe('formatPerformedSets', () => {
  it('agrupa las series iguales, como se cuentan en voz alta', () => {
    expect(
      formatPerformedSets([
        { reps: 8, weightKg: 70 },
        { reps: 8, weightKg: 70 },
        { reps: 8, weightKg: 70 },
      ]),
    ).toBe('3×8 · 70 kg')
  })

  it('con repeticiones distintas las enumera', () => {
    expect(
      formatPerformedSets([
        { reps: 8, weightKg: 70 },
        { reps: 7, weightKg: 70 },
        { reps: 6, weightKg: 70 },
      ]),
    ).toBe('8, 7, 6 · 70 kg')
  })

  it('separa los tramos cuando cambia el peso', () => {
    expect(
      formatPerformedSets([
        { reps: 10, weightKg: 60 },
        { reps: 8, weightKg: 70 },
        { reps: 8, weightKg: 70 },
      ]),
    ).toBe('10 · 60 kg y 2×8 · 70 kg')
  })

  it('el peso corporal se dice con palabras', () => {
    expect(formatPerformedSets([{ reps: 12, weightKg: 0 }])).toBe('12 · peso corporal')
  })

  it('sin series no inventa nada', () => {
    expect(formatPerformedSets([])).toBe('—')
  })
})

describe('formatWeight', () => {
  it('omite los decimales innecesarios', () => {
    expect(formatWeight(60)).toBe('60 kg')
    expect(formatWeight(62.5)).toBe('62,5 kg')
  })

  it('interpreta el peso cero como peso corporal', () => {
    expect(formatWeight(0)).toBe('peso corporal')
  })

  it('usa un guion cuando no hay peso registrado', () => {
    expect(formatWeight(null)).toBe('—')
  })
})

describe('formatVolume', () => {
  it('separa los miles como manda el español (a partir de cinco cifras)', () => {
    expect(formatVolume(2450)).toBe('2450 kg')
    expect(formatVolume(12450)).toBe('12.450 kg')
  })
})

describe('formatTargets', () => {
  it('combina series y repeticiones', () => {
    expect(formatTargets(3, 10, null)).toBe('3×10')
  })

  it('añade el peso cuando lo hay', () => {
    expect(formatTargets(3, 10, 60)).toBe('3×10 · 60 kg')
    expect(formatTargets(4, 8, 0)).toBe('4×8 · peso corporal')
  })

  it('describe series o repeticiones sueltas', () => {
    expect(formatTargets(3, null, null)).toBe('3 series')
    expect(formatTargets(1, null, null)).toBe('1 serie')
    expect(formatTargets(null, 12, null)).toBe('12 reps')
  })

  it('avisa cuando no hay ningún objetivo', () => {
    expect(formatTargets(null, null, null)).toBe('Sin objetivos')
  })
})

describe('formatOptionalTargets', () => {
  it('devuelve el mismo texto cuando hay objetivos', () => {
    expect(formatOptionalTargets(3, 10, 60)).toBe('3×10 · 60 kg')
  })

  it('devuelve null cuando no hay ninguno, para poder omitir la pista', () => {
    expect(formatOptionalTargets(null, null, null)).toBeNull()
  })
})

describe('formatSessionDate', () => {
  const now = new Date(2026, 6, 24, 20, 0)

  it('nombra el día de hoy y muestra la hora en formato 24 h', () => {
    expect(formatSessionDate(new Date(2026, 6, 24, 18, 30).toISOString(), now)).toBe('Hoy · 18:30')
  })

  it('nombra el día de ayer', () => {
    expect(formatSessionDate(new Date(2026, 6, 23, 7, 15).toISOString(), now)).toBe('Ayer · 07:15')
  })

  it('fecha los días anteriores', () => {
    const label = formatSessionDate(new Date(2026, 6, 20, 19, 0).toISOString(), now)

    expect(label).toContain('20')
    expect(label).toContain('19:00')
  })

  it('no rompe con una fecha inválida', () => {
    expect(formatSessionDate('no es una fecha', now)).toBe('—')
  })
})
