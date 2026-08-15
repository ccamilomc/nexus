/** Saludo según la hora del día (0-23). Función pura y fácil de probar. */
export function getGreeting(hour: number): string {
  if (hour >= 6 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
