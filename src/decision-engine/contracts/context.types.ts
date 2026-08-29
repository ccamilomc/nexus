/**
 * Contrato de ENTRADA del Decision Engine (ver docs/06-decision-engine-e-ia.md).
 *
 * El motor no conoce ninguna feature: define aquí la forma de los datos que
 * necesita, y son los services de cada dominio quienes rellenan este snapshot.
 * Por eso todos los tipos son locales al motor y no se importan de fuera.
 *
 * **El contrato sólo declara lo que alguna regla lee.** Llegó a pedir el perfil
 * (sexo, altura, fecha de nacimiento), los límites del día (tiempo, equipo,
 * energía), el peso objetivo y la calidad del sueño: nada de eso lo leía
 * ninguna regla, y los dos primeros ni siquiera se rellenaban con datos reales
 * —el sexo se mandaba siempre como `unspecified`, un valor que nadie había
 * dicho—. Un contrato que pide lo que no usa hace creer que el motor sabe cosas
 * que no sabe, y obliga a inventar valores para rellenarlo.
 *
 * Cuando una regla nueva necesite algo, se añade **con ella**: es entonces
 * cuando se sabe qué forma tiene que tener.
 */

export type PlanItemDomain = 'workout' | 'nutrition' | 'study' | 'habit' | 'sleep' | 'health'

export type PlanItemStatus = 'pending' | 'in_progress' | 'done' | 'skipped' | 'rescheduled'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface MacroTotals {
  readonly calories: number
  readonly proteinG: number
  readonly carbsG: number
  readonly fatG: number
}

/**
 * Los objetivos de nutrición.
 *
 * **Sin presupuesto de comida.** Lo llevaba y ninguna regla lo usaba: el dinero
 * se cuenta en finanzas, contra el tope de su categoría y sobre lo que de
 * verdad salió. Lo que el motor sí necesita del dinero es el **precio por
 * porción** de cada alimento (`FoodSnapshot`), que no es contabilidad sino un
 * atributo para comparar dos comidas.
 */
export interface NutritionGoalSnapshot extends MacroTotals {
  readonly waterMl: number
}

/**
 * Un alimento del catálogo del usuario, con lo justo para compararlo con otro.
 *
 * El precio es opcional porque en la app lo es: un alimento sin precio no puede
 * proponerse como alternativa más barata, y las reglas tienen que poder
 * distinguir «no cuesta nada» de «no sé lo que cuesta».
 */
export interface FoodSnapshot {
  readonly id: string
  readonly name: string
  /** Por porción. */
  readonly calories: number
  readonly proteinG: number
  /** Precio por porción, en la moneda del usuario; `undefined` si no lo tiene. */
  readonly costPerServing?: number
}

/** Un alimento ya registrado hoy, con lo que aportó y lo que costó. */
export interface LoggedFoodSnapshot {
  readonly foodId: string
  readonly name: string
  readonly mealType: MealType
  readonly servings: number
  /** Total del registro (porción × porciones), no por porción. */
  readonly calories: number
  readonly proteinG: number
  readonly costCop?: number
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface PlanItemSnapshot {
  readonly id: string
  readonly domain: PlanItemDomain
  readonly status: PlanItemStatus
  readonly priority: Priority
  readonly estimatedMinutes?: number
  /** ISO 8601 */
  readonly scheduledStart?: string
  /** ISO 8601 */
  readonly scheduledEnd?: string
}

export interface WorkoutSessionSnapshot {
  readonly id: string
  /** ISO 8601 (día) */
  readonly date: string
  readonly durationMinutes: number
  readonly perceivedEffort?: number
  /** Día de rutina que la originó; `undefined` si se entrenó libre. */
  readonly routineDayId?: string
}

/** Un ejercicio prescrito dentro de un día de rutina. */
export interface PrescribedExerciseSnapshot {
  readonly name: string
  readonly sets: number
}

/**
 * Un día de rutina: lo que se **planea** entrenar, no lo que se entrenó.
 *
 * Los ejercicios llegan en el orden de la rutina. Ese orden importa: por
 * convención los primeros son los básicos, y es lo que permite proponer una
 * versión corta quedándose con la cabeza de la lista en vez de elegir al azar.
 */
export interface RoutineDaySnapshot {
  readonly id: string
  readonly routineName: string
  readonly dayName: string
  readonly exercises: readonly PrescribedExerciseSnapshot[]
}

/**
 * Lo normal en el usuario para una medida.
 *
 * **El motor la recibe, no la calcula.** La mediana y su mínimo de días son
 * estadística y viven en `shared/utils/baseline`; aquí sólo llega el resultado,
 * que es lo que el motor necesita para razonar. Por eso el tipo se declara en el
 * contrato y no se importa: el motor no depende de nada de fuera (docs/06).
 */
export interface TypicalValue {
  /** Lo típico, ya redondeado. */
  readonly value: number
  /** Sobre cuántos días se calculó. Pocos días no son una costumbre. */
  readonly days: number
}

export interface DailyContext {
  /** Día evaluado, ISO 8601. */
  readonly date: string
  /** Momento de la evaluación, ISO 8601. Se inyecta para que el motor sea determinista. */
  readonly now: string
  readonly goals: {
    readonly nutrition?: NutritionGoalSnapshot
    readonly sleepMinutes?: number
    readonly studyWeeklyMinutes?: number
  }
  readonly plan: readonly PlanItemSnapshot[]
  readonly workout: {
    readonly recentSessions: readonly WorkoutSessionSnapshot[]
    /** Inicio del entrenamiento en curso (ISO), si hay alguno sin terminar. */
    readonly activeSessionStartedAt?: string
    /** Días de rutina disponibles, para poder proponer una versión más corta. */
    readonly routineDays: readonly RoutineDaySnapshot[]
  }
  readonly nutrition: {
    readonly todayIntake: MacroTotals
    /** Agua bebida hoy, en mililitros. */
    readonly todayWaterMl: number
    /** Lo comido hoy, alimento a alimento. Vacío si no se ha registrado nada. */
    readonly todayFoods: readonly LoggedFoodSnapshot[]
    /**
     * El catálogo del usuario, para poder proponer alternativas.
     *
     * Sin despensa no hay swap posible: una regla que sugiere «come otra cosa»
     * sin decir cuál no ayuda a decidir nada.
     */
    readonly pantry: readonly FoodSnapshot[]
  }
  readonly study: {
    readonly weekMinutes: number
  }
  readonly habits: {
    /** Hábitos activos hoy. */
    readonly total: number
    /** Cuántos de ellos ya están cumplidos. */
    readonly done: number
  }
  readonly sleep: {
    readonly lastNightMinutes?: number
    /**
     * Lo que **suele** dormir. `undefined` mientras no haya días suficientes.
     *
     * Con esto el motor deja de comparar contra una constante de fábrica y pasa
     * a comparar contra la persona: seis horas y media es una mala noche para
     * quien duerme ocho y una buena para quien duerme seis.
     */
    readonly typicalMinutes?: TypicalValue
  }
}
