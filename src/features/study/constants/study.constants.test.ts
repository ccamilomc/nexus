import { describe, expect, it } from 'vitest'

import { nextSubjectColor, SUBJECT_COLORS } from './study.constants'

describe('nextSubjectColor', () => {
  it('la primera materia estrena la paleta', () => {
    expect(nextSubjectColor([])).toBe(SUBJECT_COLORS[0])
  })

  it('no repite mientras queden colores libres', () => {
    const chosen: string[] = []
    for (let i = 0; i < SUBJECT_COLORS.length; i += 1) {
      chosen.push(nextSubjectColor(chosen))
    }

    expect(new Set(chosen).size).toBe(SUBJECT_COLORS.length)
  })

  it('reparte cuando ya no quedan libres, en vez de repetir siempre el mismo', () => {
    // Con la paleta entera cogida, la séptima materia coge el primero otra vez;
    // la octava tiene que coger el segundo, no volver al primero.
    const used = [...SUBJECT_COLORS]
    const seventh = nextSubjectColor(used)
    const eighth = nextSubjectColor([...used, seventh])

    expect(seventh).toBe(SUBJECT_COLORS[0])
    expect(eighth).toBe(SUBJECT_COLORS[1])
  })

  it('no se despista con un color que no es de la paleta', () => {
    // Las materias sembradas antes de que esto existiera llevan colores sueltos.
    expect(nextSubjectColor(['#123456', '#123456'])).toBe(SUBJECT_COLORS[0])
  })
})
