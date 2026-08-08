import { describe, expect, it } from 'vitest'

import { priceChangePercent, pricePerServing } from './pricing'

describe('pricePerServing', () => {
  it('reparte lo pagado entre las porciones que trae', () => {
    // Un kilo de pollo por $18.000, con la porción en 100 g: diez porciones.
    expect(pricePerServing(18_000, 1000, 100)).toBe(1800)
  })

  it('funciona cuando compras menos de una porción', () => {
    expect(pricePerServing(5_000, 50, 100)).toBe(10_000)
  })

  it('cuenta unidades igual que gramos', () => {
    // Una bandeja de 30 huevos por $21.000, con la porción en 1 unidad.
    expect(pricePerServing(21_000, 30, 1)).toBe(700)
  })

  it('redondea al peso: el COP no tiene centavos', () => {
    expect(pricePerServing(10_000, 3, 1)).toBe(3333)
  })

  it('sin cantidad no hay porciones que repartir', () => {
    expect(pricePerServing(18_000, 0, 100)).toBeNull()
  })

  it('un precio de cero seria «gratis», que no es lo mismo que «no lo sé»', () => {
    expect(pricePerServing(0, 1000, 100)).toBeNull()
  })

  it('lo negativo y lo que no es número no se cuelan', () => {
    expect(pricePerServing(-18_000, 1000, 100)).toBeNull()
    expect(pricePerServing(18_000, -1000, 100)).toBeNull()
    expect(pricePerServing(18_000, 1000, 0)).toBeNull()
    expect(pricePerServing(Number.NaN, 1000, 100)).toBeNull()
    // Un campo numérico vacío llega como '' y `Number('')` es 0, pero uno sin
    // tocar llega como undefined y da NaN: los dos tienen que caer aquí.
    expect(pricePerServing(18_000, Number.NaN, 100)).toBeNull()
  })
})

describe('priceChangePercent', () => {
  it('dice cuánto subió', () => {
    expect(priceChangePercent(1500, 1800)).toBe(20)
  })

  it('dice cuánto bajó, con signo', () => {
    expect(priceChangePercent(2000, 1500)).toBe(-25)
  })

  it('sin cambio, cero', () => {
    expect(priceChangePercent(1800, 1800)).toBe(0)
  })

  it('sin precio anterior no hay cambio del que hablar', () => {
    // Es la primera vez que se le pone precio: decir «+100 %» sería inventar
    // una subida que nunca ocurrió.
    expect(priceChangePercent(null, 1800)).toBeNull()
    expect(priceChangePercent(0, 1800)).toBeNull()
  })
})
