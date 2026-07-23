import { createClient } from '@supabase/supabase-js'

import { env } from '@/core/config/env'

/**
 * Instancia única del cliente de Supabase para toda la app (Single Source of
 * Truth). Ningún otro módulo debe crear un cliente propio. Los repositorios son
 * los únicos que lo consumen (ver docs/02-arquitectura.md).
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
