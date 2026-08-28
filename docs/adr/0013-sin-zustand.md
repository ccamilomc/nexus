# ADR-0013 · El estado global de UI no hace falta, y Zustand sale

**Estado:** Aceptado · **Fecha:** 2026-08-28

## Contexto

`zustand` figura en el stack obligatorio del `CLAUDE.md` desde la Fase 1, con un
papel escrito: «Estado global de UI. **Sólo** estado de UI, no server state»
(docs/10). Es la misma historia que `framer-motion` en el
[ADR-0009](./0009-sin-framer-motion.md): una dependencia mandada por la
constitución que el proyecto nunca llegó a necesitar.

Salió en una auditoría de dependencias: de las dieciocho de producción, es **la
única que no importa nadie**. Ni una línea en todo `src`, después de diecisiete
sprints y siete módulos.

## Por qué nunca hizo falta

No es que se olvidara: es que **el hueco que venía a llenar no existe en Nexus**.
Cada clase de estado ya tenía dueño, y ninguno es global:

| Qué                                    | Quién lo lleva            |
| -------------------------------------- | ------------------------- |
| Datos del servidor                     | TanStack Query            |
| Formularios                            | React Hook Form           |
| Sesión, tema, hoy                      | Contextos de `core/`      |
| Lo abierto, lo que se corrige, filtros | `useState` en su pantalla |

La única pieza que parecía global —la sesión— vive en un contexto de `core/auth`
desde el Sprint 4, y ahí está bien: es infraestructura, no estado de interfaz.

Lo demás resultó ser **local de verdad**. Qué movimiento se está corrigiendo sólo
le importa a Finanzas; qué día de la rutina está abierto, sólo a Entrenamiento.
Subirlo a una tienda global habría acoplado pantallas que hoy no se conocen, que
es justo lo que la arquitectura por dominios evita.

## La decisión

Se quita de `package.json` y de docs/10.

**No pesaba en el paquete**: al no importarla nadie, el empaquetador ya la
descartaba. Lo que costaba era otra cosa —una dependencia que instalar, que
auditar y que actualizar, y un stack documentado que no se parecía al real. Quien
leyera docs/10 esperaría encontrar tiendas de Zustand y no hay ninguna.

## Qué haría falta para volver a traerla

Un estado de interfaz que **dos pantallas de dominios distintos** tengan que
compartir y que no sea ni datos del servidor ni sesión. Hoy no hay ninguno.

Si aparece uno solo, antes de instalar nada toca preguntarse si no es un contexto
de `core/`, que es como se resolvieron la sesión y el tema. Zustand se justifica
cuando sean varios y con escrituras frecuentes, donde un contexto vuelve a
renderizar de más.

## Consecuencias

- Una dependencia menos que mantener; diecisiete en producción.
- `CLAUDE.md` la sigue listando, y se queda: es la constitución del proyecto y no
  se reescribe desde un ADR. Este documento es la excepción razonada, igual que
  el ADR-0009 con `framer-motion` y el ADR-0012 con el tema claro.
- Si el día de mañana hace falta, volver a instalarla cuesta un `npm install`.
