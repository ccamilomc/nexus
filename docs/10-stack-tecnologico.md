# 10 · Stack tecnológico

El stack está **fijado por la [constitución](../CLAUDE.md)** y no se cambia sin
autorización explícita del usuario y una justificación técnica muy sólida. Este
documento lo enumera, justifica el rol de cada pieza y define la política de
dependencias.

## Frontend

| Tecnología              | Rol                   | Por qué                                                                    |
| ----------------------- | --------------------- | -------------------------------------------------------------------------- |
| **React**               | Librería de UI        | Estándar, ecosistema enorme, componentes funcionales.                      |
| **Vite**                | Build & dev server    | Arranque y HMR instantáneos; build optimizado.                             |
| **TypeScript (strict)** | Lenguaje              | Seguridad de tipos de extremo a extremo. Obligatorio `strict`.             |
| **Tailwind CSS**        | Estilos               | Utilidades consistentes; design tokens vía variables CSS.                  |
| **shadcn/ui**           | Componentes base      | Código propio (no dependencia opaca), accesible, sobre Radix.              |
| **React Router**        | Enrutado              | Rutas anidadas, protección de rutas, lazy loading.                         |
| **TanStack Query**      | Server state          | Cache, revalidación, offline, reintentos. **Único** canal a datos remotos. |
| **React Hook Form**     | Formularios           | Rendimiento (no re-render por tecla) y ergonomía.                          |
| **Zod**                 | Validación & esquemas | Fuente única de verdad de la validación; infiere tipos TS.                 |
| **Zustand**             | Estado global de UI   | Ligero, sin boilerplate. **Sólo** estado de UI, no server state.           |
| **Framer Motion**       | Animaciones           | Animaciones declarativas; degradables sin romper funcionalidad.            |
| **Lucide React**        | Iconografía           | **Única** librería de iconos, para consistencia visual.                    |
| **Recharts**            | Gráficas              | Declarativo sobre SVG; suficiente para Analytics.                          |

## Backend

| Tecnología           | Rol              | Por qué                                                                         |
| -------------------- | ---------------- | ------------------------------------------------------------------------------- |
| **Supabase**         | BaaS             | Postgres + Auth + Storage + Edge Functions en una plataforma.                   |
| **PostgreSQL**       | Base de datos    | Relacional, normalizable, RLS nativo, JSONB donde aporta.                       |
| **Supabase Auth**    | Autenticación    | Sesiones, refresco, proveedores; integra con RLS vía `auth.uid()`.              |
| **Supabase Storage** | Archivos         | Fotos de progreso; URLs firmadas. Nunca binarios en la BD.                      |
| **Edge Functions**   | Cómputo servidor | **Sólo cuando es necesario**: p. ej. proxy seguro a la IA (esconde la API key). |

## Deployment

| Tecnología | Rol                                                               |
| ---------- | ----------------------------------------------------------------- |
| **GitHub** | Repositorio y CI (GitHub Actions para lint/typecheck/build/test). |
| **Vercel** | Hosting del frontend (Preview por PR, Production en `main`).      |

## Herramientas de calidad (Fase 1)

ESLint, Prettier, Husky (git hooks), Commitlint (Conventional Commits),
lint-staged, Vitest + Testing Library (testing), TypeScript en modo `strict`.

## Capa de IA

La IA se integra a través de una **Edge Function** que actúa de proxy al proveedor
de modelos (por defecto, la **API de Claude** de Anthropic con los modelos más
recientes). La clave del proveedor **nunca** vive en el cliente. La IA sólo
interpreta y explica; ver [Decision Engine e IA](./06-decision-engine-e-ia.md).

## Política de dependencias

Antes de instalar **cualquier** dependencia nueva hay que responder:

1. ¿Existe ya una solución nativa (plataforma/lenguaje) o en el proyecto?
2. ¿La librería está activamente mantenida y bien documentada?
3. ¿Reduce realmente el trabajo y el riesgo, o sólo ahorra unas líneas?
4. ¿Cuál es su coste de mantenimiento y su superficie de seguridad?

Si hay dudas, **no se instala**. Menos dependencias = menos mantenimiento. Toda
dependencia añadida se justifica en el PR que la introduce.

## Gestión de versiones

- Node LTS y `pnpm`/`npm` según se fije en Fase 1 (se documentará en el `README`
  raíz del proyecto y en `.nvmrc`).
- Se instala la **última versión estable** de cada paquete al inicializar
  (Fase 1) y se fija en el `package-lock`/`pnpm-lock`. No se listan versiones
  exactas en esta documentación para evitar que quede obsoleta; el lockfile es la
  fuente de verdad de versiones.

## Cambios de stack

Cualquier sustitución (p. ej. cambiar Zustand por otra librería) requiere:
un ADR nuevo que compare alternativas, ventajas/desventajas y coste de migración,
**y** la aprobación explícita del usuario. Hasta entonces, el stack anterior manda.
