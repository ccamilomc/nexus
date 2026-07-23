/**
 * Única fuente de verdad de las rutas de Nexus.
 * URLs en español, sin acentos ni `ñ`, para evitar problemas de codificación.
 */
export const ROUTES = {
  dashboard: '/',
  planning: '/plan',
  workout: '/entrenamiento',
  nutrition: '/nutricion',
  habits: '/habitos',
  study: '/estudio',
  sleep: '/sueno',
  health: '/salud',
  analytics: '/analiticas',
  assistant: '/asistente',
  settings: '/ajustes',
  more: '/mas',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
