import { describe, expect, it } from 'vitest'

import { readingAgainstTypical } from './against-typical'

/** Lo normal de alguien que pesa 91,7 y se mueve ±0,8, como en los datos reales. */
const NORMAL = { typical: 91.7, spread: 0.8, days: 62 }

describe('readingAgainstTypical', () => {
  it('sin costumbre no dice nada', () => {
    // Rellenarlo con la resta de dos lecturas sería el ruido del que se huye.
    expect(readingAgainstTypical(93.5, null)).toBeNull()
  })

  it('una pesada dentro del vaivén no es rara', () => {
    // 92,3 son seis décimas más, y el peso se mueve ocho de una vez a otra.
    expect(readingAgainstTypical(92.3, NORMAL)?.isUnusual).toBe(false)
  })

  it('justo en el borde todavía no es rara', () => {
    // Dos vaivenes exactos: hace falta pasarlos, no llegar.
    //
    // Con cifras redondas a propósito: `91,7 + 1,6` da 1,5999… en coma
    // flotante y nunca llega a tocar el borde, así que esta prueba no probaba
    // nada. Con 90 y vaivén de 1, la diferencia es exactamente 2.
    const redondo = { typical: 90, spread: 1, days: 30 }

    expect(readingAgainstTypical(92, redondo)?.isUnusual).toBe(false)
    expect(readingAgainstTypical(92.01, redondo)?.isUnusual).toBe(true)
  })

  it('pasado el borde sí lo es', () => {
    expect(readingAgainstTypical(93.5, NORMAL)?.isUnusual).toBe(true)
  })

  it('funciona igual por debajo', () => {
    // Bajar de golpe también merece mirarse dos veces.
    expect(readingAgainstTypical(89.9, NORMAL)?.isUnusual).toBe(true)
  })

  it('dice cuánto te apartas y hacia dónde', () => {
    const contra = readingAgainstTypical(93.5, NORMAL)

    expect(contra?.difference).toBe(1.8)
    expect(readingAgainstTypical(90.2, NORMAL)?.difference).toBe(-1.5)
  })

  it('redondea a los decimales de la medida', () => {
    // La columna guarda dos: «1,7999999 kg por encima» no lo dice nadie.
    const contra = readingAgainstTypical(93.4999, NORMAL)

    expect(contra?.difference).toBe(1.8)
  })

  it('midiendo siempre lo mismo, nada es raro', () => {
    // Un vaivén de cero haría rara hasta una diferencia de cien gramos, y eso
    // convertiría la báscula en una alarma.
    const contra = readingAgainstTypical(70.1, { typical: 70, spread: 0, days: 30 })

    expect(contra?.isUnusual).toBe(false)
  })

  it('lleva el vaivén para poder contarlo', () => {
    // «Tu peso se mueve ±0,8 kg» es la mitad del mensaje: sin eso, el usuario
    // no sabe contra qué se le está comparando.
    expect(readingAgainstTypical(92, NORMAL)?.spread).toBe(0.8)
  })
})
