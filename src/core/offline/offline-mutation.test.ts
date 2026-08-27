import { describe, expect, it } from 'vitest'

import { isResumableMutation, OFFLINE_MUTATIONS } from './offline-mutation'

const mutation = (mutationKey: readonly unknown[] | undefined, isPaused: boolean) => ({
  options: { mutationKey },
  state: { isPaused },
})

describe('isResumableMutation', () => {
  it('guarda lo pausado que tiene una clave conocida', () => {
    expect(isResumableMutation(mutation(OFFLINE_MUTATIONS.addWater, true))).toBe(true)
  })

  it('no guarda lo que ya salió: sólo espera quien está pausado', () => {
    expect(isResumableMutation(mutation(OFFLINE_MUTATIONS.addWater, false))).toBe(false)
  })

  it('no guarda lo pausado sin clave, que no habría forma de enviar', () => {
    // Es lo que pasaba antes: el aviso llegó a prometer «6 registros guardados»
    // y ninguno podía salir, porque sin clave no hay función que ejecutar.
    expect(isResumableMutation(mutation(undefined, true))).toBe(false)
  })

  it('no guarda una clave que ya no existe, como la de una versión anterior', () => {
    expect(isResumableMutation(mutation(['offline', 'lo-que-fuera'], true))).toBe(false)
  })
})
