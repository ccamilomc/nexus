import { describe, expect, it } from 'vitest'

import { readingAgainstTypical } from './against-typical'

/** Dos vaivenes: el umbral del peso, que es el dominio de los ejemplos. */
const DOS = 2

/** Lo normal de alguien que pesa 91,7 y se mueve ±0,8, como en los datos reales. */
const NORMAL = { typical: 91.7, spread: 0.8, days: 62 }

describe('readingAgainstTypical', () => {
  it('sin costumbre no dice nada', () => {
    // Rellenarlo con la resta de dos lecturas sería el ruido del que se huye.
    expect(readingAgainstTypical(93.5, null, DOS)).toBeNull()
  })

  it('una pesada dentro del vaivén no es rara', () => {
    // 92,3 son seis décimas más, y el peso se mueve ocho de una vez a otra.
    expect(readingAgainstTypical(92.3, NORMAL, DOS)?.isUnusual).toBe(false)
  })

  it('justo en el borde todavía no es rara', () => {
    // Dos vaivenes exactos: hace falta pasarlos, no llegar.
    //
    // Con cifras redondas a propósito: `91,7 + 1,6` da 1,5999… en coma
    // flotante y nunca llega a tocar el borde, así que esta prueba no probaba
    // nada. Con 90 y vaivén de 1, la diferencia es exactamente 2.
    const redondo = { typical: 90, spread: 1, days: 30 }

    expect(readingAgainstTypical(92, redondo, DOS)?.isUnusual).toBe(false)
    expect(readingAgainstTypical(92.01, redondo, DOS)?.isUnusual).toBe(true)
  })

  it('pasado el borde sí lo es', () => {
    expect(readingAgainstTypical(93.5, NORMAL, DOS)?.isUnusual).toBe(true)
  })

  it('funciona igual por debajo', () => {
    // Bajar de golpe también merece mirarse dos veces.
    expect(readingAgainstTypical(89.9, NORMAL, DOS)?.isUnusual).toBe(true)
  })

  it('dice cuánto te apartas y hacia dónde', () => {
    const contra = readingAgainstTypical(93.5, NORMAL, DOS)

    expect(contra?.difference).toBe(1.8)
    expect(readingAgainstTypical(90.2, NORMAL, DOS)?.difference).toBe(-1.5)
  })

  it('redondea a los decimales de la medida', () => {
    // La columna guarda dos: «1,7999999 kg por encima» no lo dice nadie.
    const contra = readingAgainstTypical(93.4999, NORMAL, DOS)

    expect(contra?.difference).toBe(1.8)
  })

  it('midiendo siempre lo mismo, nada es raro', () => {
    // Un vaivén de cero haría rara hasta una diferencia de cien gramos, y eso
    // convertiría la báscula en una alarma.
    const contra = readingAgainstTypical(70.1, { typical: 70, spread: 0, days: 30 }, DOS)

    expect(contra?.isUnusual).toBe(false)
  })

  it('lleva el vaivén para poder contarlo', () => {
    // «Tu peso se mueve ±0,8 kg» es la mitad del mensaje: sin eso, el usuario
    // no sabe contra qué se le está comparando.
    expect(readingAgainstTypical(92, NORMAL, DOS)?.spread).toBe(0.8)
  })
})

describe('el umbral lo pone quien llama', () => {
  const NORMAL_DINERO = { typical: 155300, spread: 16900, days: 16 }

  it('con tres vaivenes callan cosas que con dos hablarían', () => {
    // No es un detalle: el gasto tiene muchos pequeños y unos pocos grandes, y
    // con el umbral del peso hablaría en el 9 % de los gastos en vez del 3,8 %.
    const mercado = 195000

    expect(readingAgainstTypical(mercado, NORMAL_DINERO, 2)?.isUnusual).toBe(true)
    expect(readingAgainstTypical(mercado, NORMAL_DINERO, 3)?.isUnusual).toBe(false)
  })

  it('lo que se aparta de verdad salta con cualquiera de los dos', () => {
    const errorDeUnCero = 1553000

    expect(readingAgainstTypical(errorDeUnCero, NORMAL_DINERO, 3)?.isUnusual).toBe(true)
  })
})
