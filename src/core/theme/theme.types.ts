/** Preferencia elegida por el usuario. Coincide con el enum `theme_preference` de la BD. */
export type ThemePreference = 'system' | 'light' | 'dark'

/** Tema realmente aplicado al documento una vez resuelto `system`. */
export type ResolvedTheme = 'light' | 'dark'
