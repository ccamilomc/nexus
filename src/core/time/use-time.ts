import { useContext } from 'react'

import { TimeContext } from './time.context'
import type { TimeContextValue } from './time.types'

function useTime(): TimeContextValue {
  const context = useContext(TimeContext)
  if (!context) {
    throw new Error('El reloj de la aplicación debe usarse dentro de <TimeProvider>.')
  }
  return context
}

/**
 * El día de hoy (medianoche local), vivo.
 *
 * Cambia al cruzar la medianoche y al volver a la aplicación. Úsalo siempre en
 * lugar de `new Date()` para decidir «qué día es»: si cada pantalla calcula el
 * suyo, la que lleve abierta desde anoche registrará en el día equivocado.
 */
export function useToday(): Date {
  return useTime().today
}

/**
 * El instante actual, refrescado cada hora en punto.
 *
 * Para lo que depende de la hora y no del día (el saludo). No sirve como
 * cronómetro: no cuenta segundos.
 */
export function useNow(): Date {
  return useTime().now
}
