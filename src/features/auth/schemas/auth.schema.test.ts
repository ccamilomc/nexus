import { describe, expect, it } from 'vitest'

import { loginSchema, registerSchema, resetPasswordSchema } from './auth.schema'

describe('loginSchema', () => {
  it('rechaza un correo inválido', () => {
    expect(loginSchema.safeParse({ email: 'noesuncorreo', password: 'x' }).success).toBe(false)
  })

  it('acepta credenciales con formato válido', () => {
    expect(loginSchema.safeParse({ email: 'ana@correo.com', password: 'x' }).success).toBe(true)
  })
})

describe('registerSchema', () => {
  it('exige contraseña de al menos 8 caracteres', () => {
    expect(registerSchema.safeParse({ email: 'ana@correo.com', password: '1234567' }).success).toBe(
      false,
    )
    expect(
      registerSchema.safeParse({ email: 'ana@correo.com', password: '12345678' }).success,
    ).toBe(true)
  })
})

describe('resetPasswordSchema', () => {
  it('rechaza cuando las contraseñas no coinciden', () => {
    expect(
      resetPasswordSchema.safeParse({ password: '12345678', confirm: 'distinta1' }).success,
    ).toBe(false)
  })

  it('acepta cuando coinciden', () => {
    expect(
      resetPasswordSchema.safeParse({ password: '12345678', confirm: '12345678' }).success,
    ).toBe(true)
  })
})
