# ADR-0001 · Arquitectura por capas dentro de cada feature

**Estado:** Aceptado · **Fecha:** 2026-07-22

## Contexto

Nexus crecerá durante años y por dominios. Necesitamos un flujo de datos
predecible que evite que la UI acabe consultando la BD directamente, que las
reglas de negocio se dispersen y que aparezca deuda técnica. La constitución exige
capas claras: Component → Hook → Service → Repository, y separar reglas de acceso
a datos.

## Decisión

Dentro de cada feature el flujo es **unidireccional y estricto**:

`Component (UI)` → `Hook (estado/orquestación)` → `Service (reglas de negocio)` →
`Repository (acceso a datos)` → `Supabase`.

- Cada capa **sólo** conoce la inmediatamente inferior.
- El `Repository` es el **único** que habla con Supabase (o con la cola offline).
- El `Service` contiene las reglas y puede invocar al `Decision Engine`.
- Los componentes **no** consultan ni mutan datos directamente.
- Las fronteras se aplican con ESLint (`no-restricted-imports`).

## Consecuencias

**Positivas:** testeo aislado por capa, cambios de fuente de datos localizados en
repositorios, reglas de negocio en un único lugar, y una base fácil de entender
para cualquier desarrollador senior.

**Negativas / coste:** más archivos y algo de "ceremonia" para casos triviales. Se
acepta: la legibilidad y la mantenibilidad priman sobre escribir menos código
(orden de prioridades de la constitución).

## Alternativas descartadas

- **Componentes que llaman a Supabase directamente:** rápido pero insostenible;
  mezcla responsabilidades y rompe el testeo.
- **Sólo hooks + servicios (sin repositorios):** acopla las reglas al SDK de
  Supabase y complica el offline y el cambio de proveedor.

## Referencias

[02 · Arquitectura](../02-arquitectura.md) · [03 · Estructura](../03-estructura-de-carpetas.md)
