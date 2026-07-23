import { describe, expect, it } from 'vitest'

import { getGreeting } from './greeting'

describe('getGreeting', () => {
  it('saluda por la mañana', () => {
    expect(getGreeting(8)).toBe('Buenos días')
  })

  it('saluda por la tarde', () => {
    expect(getGreeting(15)).toBe('Buenas tardes')
  })

  it('saluda por la noche (tarde y madrugada)', () => {
    expect(getGreeting(22)).toBe('Buenas noches')
    expect(getGreeting(3)).toBe('Buenas noches')
  })
})
