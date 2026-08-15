import type { QueryClient } from '@tanstack/react-query'

/**
 * Las claves de lo que se puede registrar sin conexión.
 *
 * Son literales y no se construyen al vuelo a propósito: una clave guardada en
 * el disco tiene que seguir significando lo mismo al abrir la aplicación
 * mañana. Renombrar una es dejar huérfano lo que hubiera pendiente.
 */
export const OFFLINE_MUTATIONS = {
  addWater: ['offline', 'add-water'],
} as const satisfies Record<string, readonly string[]>

export type OfflineMutationName = keyof typeof OFFLINE_MUTATIONS

/**
 * Todo lo que se encola lleva dentro de quién es.
 *
 * No se lee de la sesión al enviarlo: lo pendiente se reanuda mucho después,
 * quizá tras cerrar sesión, y entonces la sesión en curso puede ser de otra
 * persona. Es la misma cautela que firma la caché (ADR-0010).
 */
export interface OfflineVariables {
  readonly userId: string
}

/**
 * Deja registrado cómo se ejecuta una mutación encolable.
 *
 * Hace falta porque lo que se guarda en el disco son **las variables, no la
 * función**: al restaurar, TanStack sólo sabe reanudar una mutación si su clave
 * tiene un `mutationFn` puesto aquí. Sin esto lo guardado no se puede enviar,
 * que es exactamente lo que pasaba antes (ADR-0011).
 *
 * Por eso el `mutationFn` **no puede depender de nada del closure** —ni de la
 * sesión, ni del reloj, ni del día que estuviera en pantalla—: cuando se
 * reanuda no queda nada de aquello. Todo lo que necesite va en las variables.
 */
export function registerOfflineMutation<TVariables extends OfflineVariables>(
  client: QueryClient,
  name: OfflineMutationName,
  mutationFn: (variables: TVariables) => Promise<unknown>,
): void {
  client.setMutationDefaults(OFFLINE_MUTATIONS[name], {
    // El cast es inevitable: lo que se restaura del disco llega sin tipo, y es
    // esta función la que sabe qué forma tenía. Lo garantiza el registro, que es
    // el único sitio donde se emparejan clave y variables.
    mutationFn: (variables: unknown) => mutationFn(variables as TVariables),
  })
}

/** Las claves declaradas arriba, en el formato en que TanStack las guarda. */
const KNOWN_KEYS: readonly string[] = Object.values(OFFLINE_MUTATIONS).map((key) =>
  JSON.stringify(key),
)

/**
 * Qué merece la pena guardar en el disco de lo que quedó pendiente.
 *
 * **Sólo lo que se va a poder enviar.** Por defecto TanStack guarda toda
 * mutación pausada, y una pausada sin clave registrada no tiene forma de
 * reanudarse: se queda ahí para siempre, ocupando el hueco compartido con la
 * caché y contando como pendiente en un aviso que promete que se enviará.
 *
 * Salió probando: tras unos cuantos intentos sin red el aviso decía «6
 * registros guardados» y ninguno podía salir.
 */
export function isResumableMutation(mutation: {
  readonly options: { readonly mutationKey?: readonly unknown[] | undefined }
  readonly state: { readonly isPaused: boolean }
}): boolean {
  if (!mutation.state.isPaused) return false

  const key = mutation.options.mutationKey
  return key !== undefined && KNOWN_KEYS.includes(JSON.stringify(key))
}
