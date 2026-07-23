import { describe, expect, it } from 'vitest'

import { resolveTheme } from '@/core/theme/resolve-theme'

describe('resolveTheme', () => {
  it('respeta la preferencia explicita del usuario', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('sigue al sistema cuando la preferencia es "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})
