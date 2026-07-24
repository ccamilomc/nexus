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
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  // No se registran los valores para no filtrar información sensible.
  throw new Error(
    'Variables de entorno inválidas o ausentes. Copia `.env.example` a `.env` y complétalo.',
  )
}

export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
  /** Puenteo de autenticación para desarrollo. Nunca `true` en producción. */
  authDisabled: parsed.data.VITE_AUTH_DISABLED === 'true',
} as const
