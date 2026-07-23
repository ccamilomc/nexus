# 08 · Convenciones de Git

Historial **limpio, pequeño y descriptivo**. Un objetivo por commit. Nunca se
trabaja directamente sobre `main`.

## Ramas

| Prefijo     | Uso                                           | Ejemplo                    |
| ----------- | --------------------------------------------- | -------------------------- |
| `main`      | Rama estable, desplegable siempre. Protegida. | —                          |
| `feature/`  | Nueva funcionalidad.                          | `feature/workout-logging`  |
| `fix/`      | Corrección de bug.                            | `fix/auth-session-refresh` |
| `refactor/` | Refactor sin cambio de comportamiento.        | `refactor/card-component`  |
| `docs/`     | Sólo documentación.                           | `docs/database-schema`     |
| `chore/`    | Tooling, configuración, dependencias.         | `chore/setup-eslint`       |
| `release/`  | Preparación de una versión.                   | `release/1.0.0`            |

Flujo: rama desde `main` → commits pequeños → PR → revisión → merge a `main`.

## Commits — Conventional Commits

Formato: `tipo(scope): descripción en imperativo y minúscula`.

Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`,
`build`, `ci`. El `scope` es el dominio o área afectada.

Ejemplos:

```
feat(workout): agregar registro de series
fix(auth): corregir renovación de sesión
refactor(ui): simplificar componente Card
docs(database): actualizar relaciones de nutrición
test(decision-engine): cubrir regla meal_swap
chore(deps): añadir zod
```

Reglas:

- Descripción **corta** (≤ ~72 car.), en imperativo, sin punto final.
- Un commit resuelve **una** cosa. Nada de commits gigantes.
- El cuerpo (opcional) explica el **porqué**, no el qué.
- Cambios que rompen contrato: `feat(scope)!:` o footer `BREAKING CHANGE:`.
- Se valida automáticamente con **Commitlint** (Fase 1).

## Pull Requests

Antes de considerar un PR/sprint terminado se revisa: arquitectura, código,
performance, accesibilidad, seguridad, UX y documentación. No se avanza con
observaciones importantes sin resolver.

Un PR debe:

- Tener un objetivo lógico y acotado (idealmente un sprint o una feature de él).
- Pasar CI: **typecheck + lint + build + tests**.
- Actualizar la documentación afectada (la doc no puede quedar desfasada).
- Justificar cualquier dependencia nueva ([política](./10-stack-tecnologico.md#política-de-dependencias)).

## Hooks de Git (Fase 1)

- **pre-commit** (Husky + lint-staged): Prettier + ESLint sobre lo _staged_.
- **commit-msg** (Commitlint): valida el mensaje.
- **pre-push** (opcional): typecheck + tests rápidos.

Los hooks **no se saltan** (`--no-verify`) salvo autorización explícita.

## Versionado y releases

- **SemVer** (`MAJOR.MINOR.PATCH`). La v1 objetivo es `1.0.0`.
- Rama `release/x.y.z` para estabilizar; se etiqueta (`tag`) al publicar.
- El despliegue lo hace Vercel: **Preview** por cada PR, **Production** al mergear
  a `main`.
