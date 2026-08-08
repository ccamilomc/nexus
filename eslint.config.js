import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      '.husky',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.cjs',
      'prettier.config.cjs',
      'commitlint.config.cjs',
      'eslint.config.js',
      // Generado por Supabase (npm run db:types).
      'src/core/supabase/database.types.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Utilidades de desarrollo que se ejecutan con Node, no en el navegador
    // (`scripts/seed-dev-data.mjs`). No entran en el bundle, pero se revisan
    // igual: un script que escribe en la base de datos merece el mismo lint.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    // Los primitivos de shadcn/ui exportan variantes (cva) junto al componente,
    // por convención del generador. No es un problema real de fast-refresh.
    files: ['src/shared/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // ─── Fronteras entre módulos (docs/03-estructura-de-carpetas.md) ───
  // Estas reglas hacen cumplir la arquitectura de forma automática.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                'Una feature sólo se importa desde su barrel público: @/features/<nombre>. Dentro de la propia feature usa rutas relativas.',
            },
          ],
        },
      ],
    },
  },
  {
    // `finance` depende de `nutrition` para poner los precios al día al apuntar
    // el mercado (docs/02). Esa dependencia va **en un solo sentido**: el día que
    // nutrición importe finanzas habrá un ciclo, y los dos dejarán de poder
    // evolucionar por separado. Se impide aquí en vez de confiar en recordarlo.
    files: ['src/features/nutrition/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                'Una feature sólo se importa desde su barrel público: @/features/<nombre>. Dentro de la propia feature usa rutas relativas.',
            },
            {
              group: ['@/features/finance'],
              message:
                'nutrition no puede depender de finance: la dependencia va sólo de finance a nutrition (docs/02). Al revés sería un ciclo.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/*', '@/features/*/*'],
              message: 'shared/ debe ser genérico: no puede depender de features/.',
            },
            {
              group: ['@/app', '@/app/*', '@/app/*/*'],
              message: 'shared/ debe ser genérico: no puede depender de app/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/*', '@/features/*/*'],
              message: 'core/ es infraestructura: no puede depender de features/.',
            },
            {
              group: ['@/app', '@/app/*', '@/app/*/*'],
              message: 'core/ es infraestructura: no puede depender de app/.',
            },
          ],
        },
      ],
    },
  },
  {
    // El Decision Engine debe permanecer puro (ADR-0002).
    files: ['src/decision-engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'El Decision Engine debe ser puro: sin React.' },
            { name: 'zustand', message: 'El Decision Engine debe ser puro: sin estado de UI.' },
          ],
          patterns: [
            {
              group: [
                'react-*',
                '@/app',
                '@/app/*',
                '@/core',
                '@/core/*',
                '@/shared',
                '@/shared/*',
                '@/features',
                '@/features/*',
                '@supabase/*',
                '@tanstack/*',
              ],
              message:
                'El Decision Engine debe ser puro: sin React, Supabase ni dependencias de la aplicación (ADR-0002).',
            },
          ],
        },
      ],
    },
  },
  prettier,
)
