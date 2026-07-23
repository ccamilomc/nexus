import { describe, expect, it } from 'vitest'

import { createAppError, isAppError, toAppError } from '@/core/error/app-error'

describe('createAppError', () => {
  it('usa el mensaje humano por defecto del código', () => {
    expect(createAppError('not_found').message).toContain('No hemos encontrado')
  })

  it('permite sobrescribir el mensaje', () => {
    expect(createAppError('unknown', 'Mensaje propio').message).toBe('Mensaje propio')
  })
})

describe('isAppError', () => {
  it('reconoce un AppError', () => {
    expect(isAppError(createAppError('auth'))).toBe(true)
  })

  it('rechaza otros valores', () => {
    expect(isAppError(new Error('boom'))).toBe(false)
    expect(isAppError(null)).toBe(false)
    expect(isAppError('texto')).toBe(false)
  })
})

describe('toAppError', () => {
  it('devuelve el mismo AppError si ya lo es', () => {
    const original = createAppError('permission')
    expect(toAppError(original)).toBe(original)
  })

  it('clasifica un TypeError como error de red', () => {
    expect(toAppError(new TypeError('failed to fetch')).code).toBe('network')
  })

  it('clasifica cualquier otro error como desconocido', () => {
    expect(toAppError(new Error('boom')).code).toBe('unknown')
  })

  it('nunca expone el detalle tecnico en el mensaje', () => {
    expect(toAppError(new Error('SQL error en tabla users')).message).not.toContain('SQL')
  })
})
