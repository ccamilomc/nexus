import { z } from 'zod'

/**
 * Lectura tipada y validada de las variables de entorno del cliente.
 * Sólo se exponen variables con prefijo `VITE_`; ninguna debe contener secretos
 * (ver docs/12-seguridad.md). Falla de forma temprana y clara si faltan.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  // Interruptor SÓLO de desarrollo: puentea el login para revisar pantallas
  // protegidas sin iniciar sesión. Debe estar apagado en producción.
  VITE_AUTH_DISABLED: z.string().optional(),
  // Auto-login de desarrollo (cuenta de prueba). Nunca en producción.
  VITE_DEV_USER_EMAIL: z.string().optional(),
  VITE_DEV_USER_PASSWORD: z.string().optional(),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  // No se registran los valores para no filtrar información sensible.
  throw new Error(
    'Variables de entorno inválidas o ausentes. Copia `.env.example` a `.env` y complétalo.',
  )
}

// Doble candado: las ayudas de desarrollo sólo existen en el build de dev.
const isDev = import.meta.env.DEV

const devUser =
  parsed.data.VITE_DEV_USER_EMAIL && parsed.data.VITE_DEV_USER_PASSWORD
    ? { email: parsed.data.VITE_DEV_USER_EMAIL, password: parsed.data.VITE_DEV_USER_PASSWORD }
    : null

export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
  /** Puenteo de autenticación para desarrollo. Nunca activo en producción. */
  authDisabled: isDev && parsed.data.VITE_AUTH_DISABLED === 'true',
  /** Credenciales de prueba para auto-login en desarrollo (o null). */
  devUser: isDev ? devUser : null,
} as const
