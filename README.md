# Nexus

**Sistema operativo personal adaptativo** (PWA): entrenamiento, nutrición
económica, hábitos, estudio, sueño y salud, con un motor de decisiones que
**recalcula tu día**, sugiere **cambios de comida dentro de presupuesto** y propone
**rutinas alternativas**.

> El diseño completo, la arquitectura y el plan por sprints están en
> [`docs/`](./docs/README.md). La documentación es la fuente de verdad del proyecto.

## Requisitos

- **Node** ≥ 20.19 (ver [`.nvmrc`](./.nvmrc) → 24).
- **npm** (gestor de paquetes del proyecto).

## Puesta en marcha

```bash
npm install
cp .env.example .env   # y rellena las variables (ver .env.example)
npm run dev
```

## Scripts

| Script                 | Descripción                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Servidor de desarrollo (Vite).      |
| `npm run build`        | Typecheck + build de producción.    |
| `npm run preview`      | Sirve el build de producción.       |
| `npm run typecheck`    | Comprobación de tipos (sin emitir). |
| `npm run lint`         | ESLint sobre el código fuente.      |
| `npm run lint:fix`     | ESLint con autofix.                 |
| `npm run format`       | Formatea con Prettier.              |
| `npm run format:check` | Verifica el formato.                |
| `npm run test`         | Tests (Vitest, una pasada).         |
| `npm run test:watch`   | Tests en modo watch.                |

## Despliegue

El frontend se despliega en **Vercel** (Preview por PR, Production al mergear en
`main`) y `vercel.json` deja fijo lo que no se puede dejar a la detección
automática:

- **`rewrites`**: sin ella, entrar directo a `/finanzas/deudas` o recargar ahí
  devuelve un 404. Es una SPA: el servidor sirve siempre `index.html` y el router
  decide. Los archivos reales (`/sw.js`, `/assets/…`) se sirven antes de llegar a
  la regla, así que no los tapa.
- **`Cache-Control` del service worker**: si la CDN lo cachea, el navegador sigue
  pidiendo la versión vieja y la aplicación no se entera de que hay una nueva.

Variables que hay que poner en el proyecto de Vercel: **`VITE_SUPABASE_URL`** y
**`VITE_SUPABASE_ANON_KEY`**, y ninguna más. Las tres de desarrollo
(`VITE_AUTH_DISABLED`, `VITE_DEV_USER_*`) no se ponen: aunque alguien las
pusiera, `core/config/env.ts` sólo las honra cuando `import.meta.env.DEV` es
cierto, así que un build de producción las ignora.

En Supabase hay que registrar el dominio en **Authentication → URL
Configuration**: `Site URL` con la dirección de producción y, en `Redirect URLs`,
`https://<dominio>/restablecer`. Es a donde lleva el correo de recuperar
contraseña, y Supabase no redirige a un destino que no esté en esa lista.

## Stack

React · Vite · TypeScript (strict) · Tailwind CSS · shadcn/ui · React Router ·
TanStack Query · React Hook Form · Zod · Zustand · Lucide · Recharts ·
Supabase. Detalle y justificación en
[`docs/10-stack-tecnologico.md`](./docs/10-stack-tecnologico.md).

## Arquitectura

Feature-Based con capas estrictas **Component → Hook → Service → Repository →
Supabase**, un **Decision Engine** puro e independiente y una **capa de IA** de
sólo interpretación. Ver [`docs/02-arquitectura.md`](./docs/02-arquitectura.md).

## Convenciones

- Código: [`docs/07-convenciones-de-codigo.md`](./docs/07-convenciones-de-codigo.md)
- Git (Conventional Commits): [`docs/08-convenciones-de-git.md`](./docs/08-convenciones-de-git.md)

## Estado

En desarrollo por sprints. Roadmap en
[`docs/09-roadmap-y-sprints.md`](./docs/09-roadmap-y-sprints.md).
