import { createContext } from 'react'

import type { TimeContextValue } from './time.types'

/** Reloj de la aplicación. Se consume con `useNow`/`useToday`, nunca directo. */
export const TimeContext = createContext<TimeContextValue | null>(null)
