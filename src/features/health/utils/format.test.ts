import { describe, expect, it } from 'vitest'

import { formatChange, formatValue } from './format'

describe('formatValue', () => {
  it('acompaña la cifra de su unidad', () => {
    expect(formatValue(74.5, 'kg')).toBe('74,5 kg')
    expect(formatValue(82, 'cm')).toBe('82 cm')
  })
})

describe('formatChange', () => {
  it('siempre lleva signo, porque es una diferencia', () => {
    expect(formatChange(0.4, 'kg')).toBe('+0,4 kg')
    expect(formatChange(-0.7, 'kg')).toBe('−0,7 kg')
  })

  it('usa el signo menos tipográfico, no el guion', () => {
    expect(formatChange(-1, 'kg')).toContain('−')
    expect(formatChange(-1, 'kg')).not.toContain('-')
  })

  it('sin cambio lo dice con «más o menos cero»', () => {
    expect(formatChange(0, 'kg')).toBe('±0 kg')
  })
})
