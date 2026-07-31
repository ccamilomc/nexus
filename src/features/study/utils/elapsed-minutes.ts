const MS_PER_MINUTE = 60_000

/**
 * Minutos que duró una sesión cronometrada, para guardarla.
 *
 * Se redondea al minuto más cercano —los segundos no aportan nada a «cuánto
 * estudié hoy»— pero **nunca baja de uno**: parar a los cuarenta segundos
 * guardaría una sesión de cero minutos, que es como no haber registrado nada.
 *
 * Un reloj que va hacia atrás (cambio de hora, fecha corregida) no puede
 * producir una duración negativa.
 */
export function elapsedMinutes(startedAtIso: string, endedAt: Date): number {
  const elapsed = endedAt.getTime() - new Date(startedAtIso).getTime()
  if (!Number.isFinite(elapsed)) return 1

  return Math.max(1, Math.round(elapsed / MS_PER_MINUTE))
}
