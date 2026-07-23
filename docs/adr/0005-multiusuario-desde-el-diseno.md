# ADR-0005 · Multiusuario desde el diseño (RLS + user_id)

**Estado:** Aceptado · **Fecha:** 2026-07-22

## Contexto

La v1 la usa **una sola persona**, pero la visión contempla múltiples usuarios,
modo familiar, entrenador y nutricionista. Reescribir el modelo de datos y la
seguridad más tarde sería carísimo y arriesgado.

## Decisión

Diseñar como **multiusuario desde el día uno**, sin construir aún las features
multiusuario:

- Toda tabla de datos personales lleva `user_id` → `auth.users(id)`.
- **RLS activada y con políticas** en todas las tablas desde la primera migración;
  un usuario sólo accede a lo suyo.
- Catálogos (`exercises`, `foods`) admiten filas globales (`user_id null`) y
  personales, listos para compartir a futuro.
- **No** se implementan roles, hogares ni relaciones entrenador–cliente en v1
  (YAGNI), pero el modelo permite añadirlos (p. ej. tablas `households`,
  `coach_client`) sin tocar lo existente.

## Consecuencias

**Positivas:** seguridad correcta desde el inicio; evolución a multiusuario sin
reescritura; misma base para probar aislamiento entre usuarios ya en Sprint 3.

**Negativas / coste:** cada consulta y política considera `user_id` aunque hoy haya
un solo usuario; coste mínimo frente al de una migración futura.

## Alternativas descartadas

- **Single-user sin `user_id`/RLS:** más simple hoy, pero obliga a rediseñar datos
  y seguridad al escalar. Inaceptable dada la visión del producto.

## Referencias

[01 · Visión](../01-vision-y-alcance.md) · [05 · Base de datos](../05-base-de-datos.md) · [12 · Seguridad](../12-seguridad.md)
