import { describe, expect, it } from 'vitest'

import { cn } from '@/shared/lib/utils'

describe('cn', () => {
  it('combina clases', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('aplica clases condicionales', () => {
    expect(cn('a', { b: false, c: true })).toBe('a c')
  })

  it('resuelve conflictos de Tailwind (gana la última)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
