import { describe, expect, it, vi } from 'vitest'

import { fetchAllRows } from './pagination'

/** Una base falsa con `n` filas, que corta en mil como corta Supabase. */
function baseCon(n: number) {
  const todas = Array.from({ length: n }, (_, i) => ({ id: i }))

  return vi.fn((from: number, to: number) =>
    Promise.resolve({ data: todas.slice(from, Math.min(to + 1, from + 1000)), error: null }),
  )
}

describe('fetchAllRows', () => {
  it('con pocas filas hace una sola consulta', () => {
    // Lo normal: nadie paga páginas de más por una precaución que no hacía falta.
    const base = baseCon(120)

    return fetchAllRows(base).then((filas) => {
      expect(filas).toHaveLength(120)
      expect(base).toHaveBeenCalledTimes(1)
    })
  })

  it('pasado el tope trae las que faltan', async () => {
    // El caso real: 1.048 porciones de comida y llegaban 1.000. Las 48 que
    // faltaban no daban error, simplemente no estaban en las calorías.
    const base = baseCon(1048)

    const filas = await fetchAllRows(base)

    expect(filas).toHaveLength(1048)
    expect(base).toHaveBeenCalledTimes(2)
  })

  it('pide los tramos que espera Supabase', async () => {
    const base = baseCon(1048)

    await fetchAllRows(base)

    // `range` es inclusivo por los dos lados: la primera página es 0..999.
    expect(base).toHaveBeenNthCalledWith(1, 0, 999)
    expect(base).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it('con muchas páginas no se deja ninguna', async () => {
    const base = baseCon(3500)

    expect(await fetchAllRows(base)).toHaveLength(3500)
    expect(base).toHaveBeenCalledTimes(4)
  })

  it('un múltiplo exacto cuesta una consulta de más, y está bien', async () => {
    // Con mil justas no hay forma de saber si hay más sin preguntar. Se prefiere
    // una consulta vacía a devolver una lista corta sin avisar.
    const base = baseCon(2000)

    expect(await fetchAllRows(base)).toHaveLength(2000)
    expect(base).toHaveBeenCalledTimes(3)
  })

  it('sin filas no devuelve nada y no se queda dando vueltas', async () => {
    const base = baseCon(0)

    expect(await fetchAllRows(base)).toEqual([])
    expect(base).toHaveBeenCalledTimes(1)
  })

  it('un fallo se propaga en vez de devolver media lista', async () => {
    // Devolver lo que llevaba sería peor que fallar: números cortos sin aviso es
    // justo lo que esto viene a arreglar.
    const base = vi.fn((from: number) =>
      Promise.resolve(
        from === 0
          ? { data: Array.from({ length: 1000 }, (_, i) => ({ id: i })), error: null }
          : { data: null, error: { message: 'se cayó la red' } },
      ),
    )

    await expect(fetchAllRows(base)).rejects.toEqual({ message: 'se cayó la red' })
  })

  it('un null se trata como página vacía, no como fallo', async () => {
    const base = vi.fn(() => Promise.resolve({ data: null, error: null }))

    expect(await fetchAllRows(base)).toEqual([])
  })
})
