# ADR-0006 · Analytics agrega en el cliente, no en vistas SQL

**Estado:** Aceptado · **Fecha:** 2026-07-31

## Contexto

Analytics (Sprint 12) muestra KPIs, series y comparativas de los seis dominios.
El diseño original ([04](../04-modelo-de-datos.md) y [05](../05-base-de-datos.md))
preveía servirlo con **vistas SQL** que agregaran por día y dominio.

Al llegar el sprint, el proyecto ya no está donde estaba cuando se escribió esa
previsión: **las reglas de cálculo existen y están probadas en TypeScript**.
`calculateSessionStats` decide qué serie suma volumen (excluye calentamientos y
series no completadas), `calculateStreak` y `calculateConsistency` definen qué
cuenta como racha, y lo mismo ocurre con macros, gasto en COP e IMC. Una vista
que agregue volumen tendría que **reimplementar esas mismas reglas en SQL**.

## Decisión

Analytics **agrega en TypeScript**. No se crean vistas ni la tabla de rollup
`daily_summaries`.

- Cada dominio expone un tercer hook en su barrel, `useXSeries(range)`, hermano
  de los dos que ya existen: `useXSummary()` (frases, para el dashboard) y
  `useXContext()` (datos crudos, para el motor). El dominio sigue decidiendo
  **cómo se cuenta lo suyo**.
- Analytics **no tiene repositorio propio**: si lo tuviera, tendría que conocer
  las tablas de los seis dominios y rompería su aislamiento. Compone barrels,
  igual que hace `planning` con el `DailyContext`.
- Los repositorios de cada dominio ganan las consultas por rango que les falten,
  con `select()` acotado a las columnas que la serie necesita.

## Consecuencias

**Positivas:** una sola fuente de verdad por regla de negocio; la agregación
entra en la suite de vitest como el resto; iterar un KPI no exige migración ni
regenerar tipos; la propiedad de cada cálculo se queda en su módulo.

**Negativas / coste:** viajan filas crudas en lugar de agregados. Se midió el
orden de magnitud para el caso real —un usuario, 90 días— y son ~4.000 filas
estrechas en total, dominadas por `workout_sets` (~1.500). Con `select()`
acotado y la caché de TanStack Query es asumible.

**Cuándo revisar esta decisión:** si la carga de `/analiticas` se vuelve
perceptible con datos reales, o si aparecen varios usuarios con años de
historial. El camino de vuelta es incremental: una vista (o `daily_summaries`)
por detrás de `useXSeries`, sin tocar Analytics, porque el contrato es el hook y
no la consulta.

## Alternativas descartadas

- **Vistas SQL** (el diseño original): duplican en SQL reglas ya probadas en TS,
  quedan fuera del alcance de los tests, y cada KPI nuevo exige migración y
  `db:types`. Es además una **optimización sin evidencia**, que es justo lo que
  05 exige evitar para `daily_summaries`.
- **Repositorio propio de Analytics:** menos capas, pero Analytics pasaría a
  conocer las tablas de los seis dominios y a duplicar sus reglas de agregación.

## Referencias

[04 · Modelo de datos](../04-modelo-de-datos.md#analytics) ·
[05 · Base de datos](../05-base-de-datos.md#analytics-vistas-y-rollups) ·
[ADR-0001](./0001-arquitectura-por-capas.md)
