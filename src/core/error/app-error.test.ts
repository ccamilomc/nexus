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

/** Forma exacta con la que Supabase devuelve un error. */
const supabaseError = (code: string, message: string) => ({
  code,
  message,
  details: '',
  hint: '',
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

  it('NO confunde un error de Supabase con uno ya traducido', () => {
    // Tienen la misma forma (`code` + `message`); si se dieran por buenos, su
    // texto técnico acabaría en la pantalla del usuario.
    expect(isAppError(supabaseError('', 'TypeError: Failed to fetch'))).toBe(false)
    expect(isAppError(supabaseError('23503', 'violates foreign key constraint'))).toBe(false)
    expect(isAppError(supabaseError('42501', 'new row violates row-level security'))).toBe(false)
  })

  it('exige que el código sea uno de los conocidos', () => {
    expect(isAppError({ code: 'inventado', message: 'Texto' })).toBe(false)
    expect(isAppError({ code: 'offline', message: 'Texto' })).toBe(true)
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

  it('traduce los errores de Supabase en vez de dejarlos pasar', () => {
    // El caso que se vio en pantalla: la red caída mostraba «TypeError: Failed
    // to fetch» tal cual, porque el error colaba como si ya estuviera traducido.
    const translated = toAppError(supabaseError('', 'TypeError: Failed to fetch'))

    expect(translated.message).not.toContain('TypeError')
    expect(translated.message).toMatch(/conexión|conectar|Algo no ha ido bien/i)
  })

  it('tampoco deja pasar un error de Postgres', () => {
    const translated = toAppError(supabaseError('42501', 'violates row-level security policy'))

    expect(translated.message).not.toContain('row-level security')
  })
})
