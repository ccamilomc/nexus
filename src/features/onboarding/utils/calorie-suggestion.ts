import type { Profile } from '@/features/profile'

/** Lo que hace falta saber del cuerpo para proponer una cifra. */
export interface BodyFacts {
  readonly weightKg: number | null
  readonly heightCm: number | null
  readonly birthDate: string | null
  readonly sex: Profile['sex']
}

/** Una sugerencia de calorías con lo que se supuso para calcularla. */
export interface CalorieSuggestion {
  readonly calories: number
  /**
   * Si salió de los datos de la persona o de una media.
   *
   * Se devuelve para que la pantalla pueda decirlo: proponer una cifra sin
   * avisar de que es genérica sería fingir una precisión que no se tiene.
   */
  readonly isPersonal: boolean
}

/**
 * Cuánto se multiplica el gasto en reposo por moverse.
 *
 * **1,375 es «actividad ligera» y es una suposición**, no un dato: en la
 * bienvenida todavía no se ha entrenado nada, así que Nexus no puede saberlo.
 * Se elige el escalón de alguien que entrena algunos días y no el de alguien
 * sedentario porque quien instala esta aplicación suele estar en el primero, y
 * quedarse corto empuja a comer de menos, que es el error más caro de los dos.
 *
 * La pantalla lo dice en voz alta y la cifra se puede cambiar.
 */
const LIGHT_ACTIVITY = 1.375

/** Cifra que se propone cuando no hay datos del cuerpo. */
const GENERIC_CALORIES = 2000

/**
 * Constante de la fórmula de Mifflin-St Jeor según el sexo.
 *
 * Sin declararlo se usa el punto medio de los otros dos. **No es un promedio
 * con sentido biológico**: es la forma menos mala de no dejar a nadie fuera ni
 * obligarle a elegir una casilla para poder usar la aplicación.
 */
const SEX_OFFSET: Record<Profile['sex'], number> = {
  male: 5,
  female: -161,
  other: -78,
  unspecified: -78,
}

/** Años cumplidos, o `null` si no se sabe la fecha. */
function ageOn(birthDate: string | null, today: Date): number | null {
  if (!birthDate) return null

  const [year, month, day] = birthDate.split('-').map(Number)
  if (!year || !month || !day) return null

  const hadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)

  return today.getFullYear() - year - (hadBirthday ? 0 : 1)
}

/**
 * Propone unas calorías diarias a partir del cuerpo, o una cifra genérica.
 *
 * Usa Mifflin-St Jeor, que es la fórmula estándar, por el gasto en reposo, y lo
 * multiplica por la actividad supuesta. **Es una estimación y la pantalla lo
 * dice**: dos personas con los mismos números gastan distinto, y esta cifra
 * sirve para tener un punto de partida, no para obedecerla.
 *
 * Sin peso o sin estatura no hay fórmula que valga: devuelve la genérica en vez
 * de inventarse los datos que faltan.
 */
export function suggestCalories(body: BodyFacts, today: Date): CalorieSuggestion {
  const age = ageOn(body.birthDate, today)

  if (!body.weightKg || !body.heightCm || age === null) {
    return { calories: GENERIC_CALORIES, isPersonal: false }
  }

  const restingRate =
    10 * body.weightKg + 6.25 * body.heightCm - 5 * age + SEX_OFFSET[body.sex ?? 'unspecified']

  // A la decena: dar «2.347 kcal» fingiría una precisión que la fórmula no
  // tiene, y nadie come con esa exactitud.
  return { calories: Math.round((restingRate * LIGHT_ACTIVITY) / 10) * 10, isPersonal: true }
}
