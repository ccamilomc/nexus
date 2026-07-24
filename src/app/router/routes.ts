/**
 * Única fuente de verdad de las rutas de Nexus.
 * URLs en español, sin acentos ni `ñ`, para evitar problemas de codificación.
 */
export const ROUTES = {
  // Públicas (sin sesión)
  login: '/entrar',
  register: '/crear-cuenta',
  forgotPassword: '/recuperar',
  resetPassword: '/restablecer',
  // Protegidas (requieren sesión)
  dashboard: '/',
  planning: '/plan',
  workout: '/entrenamiento',
  workoutHistory: '/entrenamiento/historial',
  workoutExercises: '/entrenamiento/ejercicios',
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
