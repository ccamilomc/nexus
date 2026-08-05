# 13 · Offline y PWA

Nexus es **offline-first**: registrar información **nunca** depende de la conexión.
La app debe sentirse nativa e instalable. Esta capa se implementa en los Sprints
14 (offline) y 15 (PWA), pero la arquitectura está preparada desde el diseño.

## Offline-first

### Preparación desde el diseño

- Los **repositorios** son la costura: escriben en Supabase con red, o en la
  **cola local** sin red. El resto de capas no sabe si hay conexión.
- Toda tabla sincronizable tiene `updated_at` (resolución de conflictos) y
  `deleted_at` (tombstones para borrados). Ver [05](./05-base-de-datos.md).
- Los ids son **UUID generados en cliente**: una entidad creada offline ya tiene
  su id definitivo y no necesita reconciliación de claves al sincronizar.

### Estrategia de cache y estado

- **TanStack Query** cachea el server state; su cache se **persiste** (para
  disponer de datos al abrir sin red).
- El **Service Worker** cachea el _app shell_ y assets (estrategia de cache
  inteligente por tipo de recurso).

### Cola de escritura offline

```mermaid
flowchart LR
    UI["Acción del usuario"] --> S["Service"]
    S --> R["Repository"]
    R -->|online| SB[("Supabase")]
    R -->|offline| Q["Cola persistente (IndexedDB)"]
    Q -->|reconexión| SYNC["Sincronizador"]
    SYNC --> SB
    SB --> QC["Actualiza cache TanStack Query"]
```

- Las mutaciones offline se **encolan** de forma persistente y se aplican de forma
  **optimista** en la cache (la UI responde al instante).
- Al recuperar conexión, el **sincronizador** reproduce la cola en orden.

### Resolución de conflictos

- Estrategia base: **last-write-wins por `updated_at`**.
- Borrados: **tombstones** con `deleted_at` (no se pierde el hecho de borrar).
- Casos con lógica de negocio sensible (p. ej. un `plan` recalculado) pueden usar
  reglas específicas en el service; se documentará al implementarlo.
- Nunca se pierden datos silenciosamente: los conflictos no triviales se registran
  y, si procede, se informan al usuario.

### Decisión de librería de persistencia

**Resuelta:** persister síncrono de TanStack sobre `localStorage`. Se midió la
caché real —**34,2 KB** con la pantalla más pesada abierta— y no justifica ni
IndexedDB ni una dependencia nueva. Razonado en
[ADR-0007](./adr/0007-cache-persistente-en-localstorage.md), que también explica
por qué se borra al cerrar sesión y por qué un `maxAge` de 7 días no puede hacer
pasar datos viejos por los de hoy.

## PWA

### Objetivos

Sentirse como app nativa, instalable en Android e iOS, con actualizaciones
controladas y notificaciones útiles.

### Componentes

| Pieza               | Rol                                                                  |
| ------------------- | -------------------------------------------------------------------- |
| **Manifest**        | Nombre, iconos, colores de tema, `display: standalone`, orientación. |
| **Service Worker**  | Cache del app shell, estrategia offline, actualización.              |
| **Instalación**     | Prompt de instalación (A2HS) con buen momento y UX.                  |
| **Actualizaciones** | Aviso al usuario cuando hay versión nueva; recarga controlada.       |

### Notificaciones

- **Ayudan, no molestan.** Prioridad: agua, entrenamientos, hábitos, estudio.
- Nada de notificaciones repetitivas. El usuario **controla completamente** su
  configuración (`user_preferences`).
- Canales: `in_app` y `push` (ver enum en [04](./04-modelo-de-datos.md)).

### Compatibilidad

- Se contemplan las limitaciones de **iOS** (Service Worker y push más
  restringidos): se degrada con elegancia y se prioriza la instalación A2HS y el
  offline de lectura/registro.

## Definición de "Hecho" de esta capa

- Registrar datos sin conexión y verlos reflejados de inmediato.
- Sincronizar al reconectar **sin pérdida** de datos ni duplicados.
- App instalable, con app shell disponible offline y actualizaciones avisadas.
- Notificaciones configurables y no intrusivas.
