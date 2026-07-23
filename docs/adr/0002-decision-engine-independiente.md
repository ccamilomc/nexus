# ADR-0002 · Decision Engine como módulo puro e independiente

**Estado:** Aceptado · **Fecha:** 2026-07-22

## Contexto

El valor diferencial de Nexus es **decidir/recalcular** (recálculo del día, swaps
de comida, rutinas alternativas). Esta lógica es crítica, debe ser reproducible,
testeable y no puede depender de un modelo de IA ni acoplarse a la UI o a la BD.

## Decisión

Se crea un módulo **puro** `src/decision-engine/`:

- Sin dependencias de React, Supabase ni de las features.
- Define **contratos**: entrada `DailyContext`, salida `Recommendation[]`.
- Reglas como **funciones puras** (una por archivo), versionadas.
- **Determinista**: recibe `now` en el contexto; no lee reloj ni aleatoriedad.
- **No persiste**: sólo calcula; persistir es tarea del service que lo invoca.
- Dirección de dependencia: las features dependen de los contratos del motor; el
  motor **no** depende de ninguna feature.

## Consecuencias

**Positivas:** máxima testabilidad (contexto fijo → salida esperada), lógica de
negocio central en un solo sitio, evolución por reglas versionadas, e independencia
total de la IA y de la infraestructura.

**Negativas / coste:** hay que **construir el `DailyContext`** en los services
(trabajo de ensamblado). Se acepta porque desacopla el motor y lo hace portable y
verificable.

## Alternativas descartadas

- **Reglas dispersas en los services:** difícil de testear en conjunto y propenso
  a inconsistencias entre dominios.
- **Delegar las decisiones a la IA:** no determinista, no verificable y crea
  dependencia de un servicio externo para lógica crítica (ver
  [ADR-0003](./0003-ia-como-capa-de-interpretacion.md)).

## Referencias

[06 · Decision Engine e IA](../06-decision-engine-e-ia.md)
