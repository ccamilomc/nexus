import { createClient } from '@supabase/supabase-js'

import { env } from '@/core/config/env'
import type { Database } from '@/core/supabase/database.types'

/**
 * Instancia única del cliente de Supabase para toda la app (Single Source of
 * Truth), tipada con el esquema de la base de datos. Ningún otro módulo debe
 * crear un cliente propio. Los repositorios son los únicos que lo consumen
 * (ver docs/02-arquitectura.md).
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
