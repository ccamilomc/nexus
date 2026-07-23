# ADR-0004 · Estrategia offline-first con cola y last-write-wins

**Estado:** Aceptado · **Fecha:** 2026-07-22

## Contexto

Registrar entrenamientos, comidas o hábitos ocurre a menudo sin buena conexión
(gimnasio, calle). La constitución exige **offline-first**: registrar nunca puede
depender de la red, y al reconectar hay que sincronizar sin perder datos.

## Decisión

- Los **repositorios** son la costura online/offline; las capas superiores no
  saben si hay red.
- **IDs UUID generados en cliente**: una entidad creada offline ya tiene su id
  definitivo (sin reconciliación de claves).
- **Cache persistente** de TanStack Query + **cola de mutaciones** en IndexedDB;
  aplicación **optimista** en la UI.
- Sincronización al reconectar reproduciendo la cola en orden.
- Conflictos: **last-write-wins por `updated_at`**; borrados con **tombstones**
  (`deleted_at`). Casos sensibles pueden tener reglas específicas en el service.
- La **librería** de persistencia se decide en el Sprint 14 (YAGNI), favoreciendo
  la opción más simple que cumpla.

## Consecuencias

**Positivas:** UX inmediata y fiable sin red; base de datos preparada
(`updated_at`/`deleted_at`) desde el día uno; sin pérdida silenciosa de datos.

**Negativas / coste:** LWW puede descartar cambios concurrentes en escenarios
multidispositivo; aceptable en v1 (un usuario, un dispositivo dominante) y
revisable con CRDTs u otras estrategias si el caso multidispositivo lo exige.

## Alternativas descartadas

- **Online-only:** viola la constitución y da mala UX en el gimnasio.
- **Sincronización con merge por campos/CRDT desde v1:** complejidad no
  justificada aún (YAGNI). La arquitectura no la bloquea a futuro.

## Referencias

[13 · Offline y PWA](../13-offline-y-pwa.md) · [05 · Base de datos](../05-base-de-datos.md)
