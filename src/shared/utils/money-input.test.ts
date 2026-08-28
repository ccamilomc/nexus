import { describe, expect, it } from 'vitest'

import { formatCop } from './format-money'
import { caretAfterFormat, digitsBefore, formatMoneyInput, parseMoneyInput } from './money-input'

describe('formatMoneyInput', () => {
  it('agrupa de tres en tres', () => {
    expect(formatMoneyInput('1000')).toBe('1.000')
    expect(formatMoneyInput('164800')).toBe('164.800')
    expect(formatMoneyInput('1500000')).toBe('1.500.000')
  })

  it('agrupa igual que como se lee después', () => {
    // Teclear «1.000» y ver luego «$ 1,000» haría dudar de si se guardó lo que
    // se escribió.
    expect(formatCop(1_500_000)).toContain(formatMoneyInput('1500000'))
  })

  it('por debajo de mil no pone nada', () => {
    expect(formatMoneyInput('999')).toBe('999')
  })

  it('el campo vacío se queda vacío', () => {
    // Poner un cero sería escribir por el usuario algo que no escribió.
    expect(formatMoneyInput('')).toBe('')
  })

  it('ignora lo que no sean dígitos', () => {
    // Pegar «$ 45.000» desde otro sitio tiene que funcionar.
    expect(formatMoneyInput('$ 45.000')).toBe('45.000')
    expect(formatMoneyInput('45abc000')).toBe('45.000')
  })

  it('quita los ceros de la izquierda', () => {
    expect(formatMoneyInput('007')).toBe('7')
  })

  it('sin permiso, el signo no entra', () => {
    expect(formatMoneyInput('-500')).toBe('500')
  })

  it('con permiso, deja escribir en negativo', () => {
    // Una tarjeta de crédito empieza debiendo.
    expect(formatMoneyInput('-500000', true)).toBe('-500.000')
  })

  it('un signo a medio escribir se conserva', () => {
    // Quitarlo dejaría el campo imposible de usar: al teclear «-» desaparece y
    // el número entra en positivo.
    expect(formatMoneyInput('-', true)).toBe('-')
  })
})

describe('parseMoneyInput', () => {
  it('lee la cifra agrupada', () => {
    expect(parseMoneyInput('1.500.000')).toBe(1_500_000)
  })

  it('vacío no es cero', () => {
    // El esquema distingue «no escribió nada» de «escribió cero», y el mensaje
    // que sale es distinto.
    expect(parseMoneyInput('')).toBeNaN()
    expect(parseMoneyInput('-')).toBeNaN()
  })

  it('lee el negativo', () => {
    expect(parseMoneyInput('-500.000')).toBe(-500_000)
  })

  it('lo que se ve y lo que se guarda son la misma cifra', () => {
    // Es la propiedad que importa: nada se pierde entre pintar y guardar.
    for (const cifra of ['7', '999', '1000', '164800', '9999999999']) {
      expect(parseMoneyInput(formatMoneyInput(cifra))).toBe(Number(cifra))
    }
  })
})

describe('el cursor al reagrupar', () => {
  it('cuenta los dígitos que hay por delante', () => {
    expect(digitsBefore('1.500|000'.replace('|', ''), 5)).toBe(4)
  })

  it('no cuenta los puntos', () => {
    expect(digitsBefore('1.500.000', 7)).toBe(5)
  })

  it('se queda detrás del mismo dígito aunque aparezca un punto', () => {
    // Tecleado «1000», el campo pasa a «1.000»: el cursor iba tras el cuarto
    // dígito y tiene que seguir ahí, en la posición 5 y no en la 4.
    expect(caretAfterFormat('1.000', 4)).toBe(5)
  })

  it('en medio de la cifra se queda en medio', () => {
    // Corregir un cero de más es el caso que se rompe si esto va por caracteres.
    expect(caretAfterFormat('1.500.000', 2)).toBe(3)
  })

  it('sin dígitos por delante va al principio', () => {
    expect(caretAfterFormat('1.000', 0)).toBe(0)
  })

  it('con signo se pone detrás del signo, que no es sitio para escribir', () => {
    expect(caretAfterFormat('-1.000', 0)).toBe(1)
  })

  it('más dígitos de los que hay lo deja al final', () => {
    expect(caretAfterFormat('1.000', 99)).toBe(5)
  })
})
