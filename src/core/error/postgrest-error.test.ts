import { describe, expect, it } from 'vitest'

import { isForeignKeyViolation } from './postgrest-error'

describe('isForeignKeyViolation', () => {
  it('reconoce el código 23503', () => {
    expect(isForeignKeyViolation({ code: '23503', message: 'update or delete violates…' })).toBe(
      true,
    )
  })

  it('ignora otros códigos y otras formas', () => {
    expect(isForeignKeyViolation({ code: '23505' })).toBe(false)
    expect(isForeignKeyViolation(new Error('boom'))).toBe(false)
    expect(isForeignKeyViolation(null)).toBe(false)
    expect(isForeignKeyViolation('23503')).toBe(false)
  })
})
