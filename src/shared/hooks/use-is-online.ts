import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

/**
 * Si hay conexión, según **quien decide** si hay conexión.
 *
 * Se pregunta al `onlineManager` de TanStack Query y no a `navigator.onLine`
 * directamente. No es un capricho: es el mismo que pausa las consultas cuando
 * se cae la red, así que preguntándole a él la pantalla no puede contradecir a
 * los datos. Con dos fuentes distintas cabría el caso de una interfaz diciendo
 * «ya hay señal» sobre consultas que siguen dormidas.
 *
 * Se suscribe en lugar de leerlo una vez: al volver la señal, TanStack reanuda
 * lo que había pausado y la pantalla tiene que enterarse.
 */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(() => onChange()),
    () => onlineManager.isOnline(),
    // Sin ventana (una render en servidor) se asume que hay red: es lo que
    // permite pintar el estado de carga normal en lugar de un aviso falso.
    () => true,
  )
}
