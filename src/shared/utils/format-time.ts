/**
 * Hora local de un registro: `14:30`.
 *
 * En formato de 24 horas a propósito: es como se lee la hora en Colombia y
 * ocupa lo mismo siempre, así que las listas de registros no bailan. Lo usan
 * varios módulos (nutrición, estudio), por eso vive aquí y no en uno de ellos.
 */
export function formatTime(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
}
