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
  onboarding: '/bienvenida',
  today: '/',
  planning: '/plan',
  workout: '/entrenamiento',
  workoutHistory: '/entrenamiento/historial',
  workoutExercises: '/entrenamiento/ejercicios',
  workoutRoutines: '/entrenamiento/rutinas',
  nutrition: '/nutricion',
  nutritionFoods: '/nutricion/alimentos',
  nutritionGoals: '/nutricion/objetivos',
  habits: '/habitos',
  study: '/estudio',
  studySubjects: '/estudio/materias',
  sleep: '/sueno',
  health: '/salud',
  finance: '/finanzas',
  financeRecurring: '/finanzas/fijos',
  financeDebts: '/finanzas/deudas',
  financeAccounts: '/finanzas/cuentas',
  financeCategories: '/finanzas/categorias',
  dashboard: '/dashboard',
  // `assistant` volverá con la capa de IA. Mientras no exista no tiene ruta:
  // una pantalla que promete algo que no llega resta más de lo que suma.
  settings: '/ajustes',
  more: '/mas',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

/** Patrón de ruta del detalle de una rutina (con parámetro), para el router. */
export const WORKOUT_ROUTINE_DETAIL_PATTERN = `${ROUTES.workoutRoutines}/:routineId`

/** Ruta al detalle de una rutina concreta. */
export function workoutRoutinePath(routineId: string): string {
  return `${ROUTES.workoutRoutines}/${routineId}`
}
