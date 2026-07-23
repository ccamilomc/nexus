import { describe, expect, it } from 'vitest'

import { mapAuthError } from './auth.errors'

describe('mapAuthError', () => {
  it('traduce credenciales inválidas', () => {
    const result = mapAuthError('Invalid login credentials')
    expect(result.code).toBe('auth')
    expect(result.message).toContain('incorrectos')
  })

  it('traduce correo no confirmado', () => {
    expect(mapAuthError('Email not confirmed').code).toBe('auth')
  })

  it('traduce correo ya registrado como validación', () => {
    expect(mapAuthError('User already registered').code).toBe('validation')
  })

  it('traduce demasiados intentos', () => {
    expect(mapAuthError('email rate limit exceeded').message).toContain('Demasiados intentos')
  })

  it('usa "desconocido" ante un mensaje no reconocido', () => {
    expect(mapAuthError('algo raro sin coincidencias').code).toBe('unknown')
  })

  it('nunca expone el detalle técnico al usuario', () => {
    expect(mapAuthError('Invalid login credentials').message).not.toContain('Invalid')
  })
})
