import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

/**
 * Dónde se guarda la caché entre sesiones.
 *
 * `localStorage` y no IndexedDB: se midió la caché real —34 KB con la pantalla
 * más pesada abierta— y no justifica una dependencia más ni una hidratación
 * asíncrona (ver [ADR-0007](../../../docs/adr/0007-cache-persistente-en-localstorage.md)).
 *
 * Lo que se guarda son **resultados ya agregados**, no filas crudas: las miles de
 * filas que descarga Analytics se reducen a unas series de pocos KB.
 */
const STORAGE_KEY = 'nexus.query-cache'

/**
 * Versión del formato de lo cacheado.
 *
 * Al cambiarla se descarta lo guardado en vez de rehidratar datos con una forma
 * que el código ya no entiende. **Se sube a mano** cuando cambie la forma de lo
 * que devuelven los servicios.
 */
export const CACHE_BUSTER = 'v1'

/**
 * Cuánto se considera aprovechable lo guardado.
 *
 * Siete días es seguro porque las claves de lo que cambia a diario llevan la
 * fecha dentro (`day(userId, '2026-08-05')`): una caché vieja no puede hacerse
 * pasar por la de hoy, simplemente no existe bajo la clave de hoy. Lo que sí
 * sobrevive son catálogos e históricos, donde ver la última versión conocida es
 * exactamente lo que se quiere sin señal.
 */
export const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: STORAGE_KEY,
})

/**
 * Borra la caché guardada en el dispositivo.
 *
 * Se llama al cerrar sesión. La caché lleva datos de salud en claro; si
 * sobreviviera al logout, la siguiente persona que abriese ese navegador vería
 * el historial de la anterior. La RLS protege el servidor, no el disco.
 */
export function clearPersistedCache(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
