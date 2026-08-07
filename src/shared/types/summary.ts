/**
 * Un avance hacia un objetivo del día, tal como lo cuenta su dominio.
 *
 * Es la única grieta que se abre en el contrato de los resúmenes, que hasta
 * ahora devolvían **sólo frases** para que el dashboard no tuviera que conocer
 * macros, rachas ni unidades. Esa intención se conserva: el dominio sigue
 * decidiendo qué mide, con qué palabra y en qué unidad —aquí viene ya escrito en
 * `display`—. Lo único que se añade son las dos cifras que hacen falta para
 * **dibujar** el avance, porque una barra no se puede pintar desde una frase.
 *
 * **Sólo lo publica quien tiene un objetivo de verdad.** Sin meta no hay avance
 * que dibujar, y una barra inventada mentiría: entrenamiento y salud no traen
 * ninguna, y sueño tampoco mientras su objetivo no llegue al resumen.
 */
export interface SummaryProgress {
  /** Qué se mide, con la palabra del dominio: «Calorías», «Agua», «Hábitos». */
  readonly label: string
  /** Lo que se lleva y la meta, en la unidad que use el dominio. */
  readonly value: number
  readonly target: number
  /** La cifra ya escrita: «850 de 2.000 kcal». El dominio decide el formato. */
  readonly display: string
}

/**
 * Lo que todo dominio devuelve al dashboard.
 *
 * Los seis resúmenes ya tenían esta forma por convención; escribirla una vez
 * evita que el séptimo (finanzas) la reinvente con otro nombre.
 */
export interface DomainSummaryData {
  readonly isPending: boolean
  /** No hay nada registrado, y por eso se enseña el texto de vacío. */
  readonly isEmpty: boolean
  /** Frases para lo que no es un avance: una racha, una media, un peso. */
  readonly lines: readonly string[]
  /** Avances con objetivo. Vacío cuando el dominio no tiene ninguno. */
  readonly progress: readonly SummaryProgress[]
}
