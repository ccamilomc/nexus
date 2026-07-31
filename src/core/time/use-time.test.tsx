import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TimeProvider } from './TimeProvider'
import { useNow, useToday } from './use-time'

/** 29 de julio de 2026, a las once y media de la noche (hora local). */
const LATE_NIGHT = new Date(2026, 6, 29, 23, 30)
const HALF_HOUR_MS = 30 * 60 * 1_000
/** Media hora y pico: lo justo para dejar atrás la hora en punto y su margen. */
const PAST_MIDNIGHT_MS = HALF_HOUR_MS + 5_000

function wrapper({ children }: PropsWithChildren) {
  return <TimeProvider>{children}</TimeProvider>
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(LATE_NIGHT)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToday', () => {
  it('devuelve el día actual a medianoche, no el instante', () => {
    const { result } = renderHook(() => useToday(), { wrapper })

    expect(result.current).toEqual(new Date(2026, 6, 29))
  })

  it('cambia de día al pasar la medianoche con la pantalla abierta', () => {
    const { result } = renderHook(() => useToday(), { wrapper })

    act(() => {
      vi.advanceTimersByTime(PAST_MIDNIGHT_MS)
    })

    expect(result.current).toEqual(new Date(2026, 6, 30))
  })

  it('mantiene la misma referencia mientras no cambie el día', () => {
    // Sirve como dependencia y como clave de consulta sin trabajo de más,
    // aunque el reloj despierte cada hora.
    vi.setSystemTime(new Date(2026, 6, 29, 9, 30))
    const { result } = renderHook(() => useToday(), { wrapper })
    const first = result.current

    act(() => {
      vi.advanceTimersByTime(HALF_HOUR_MS + 5_000)
    })

    expect(result.current).toBe(first)
  })

  it('se pone al día al volver a la aplicación', () => {
    // En el móvil los temporizadores no corren con la pantalla apagada: al
    // volver, la fecha tiene que ponerse al día igualmente.
    const { result } = renderHook(() => useToday(), { wrapper })

    act(() => {
      vi.setSystemTime(new Date(2026, 6, 31, 9, 0))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toEqual(new Date(2026, 6, 31))
  })

  it('avisa si se usa fuera del provider', () => {
    expect(() => renderHook(() => useToday())).toThrow(/TimeProvider/)
  })
})

describe('useNow', () => {
  it('avanza al cambiar la hora, para lo que depende de ella', () => {
    // El saludo cambia a las 6, las 12 y las 19: sin esto, quien abre la app
    // por la mañana seguiría leyendo «Buenos días» al anochecer.
    vi.setSystemTime(new Date(2026, 6, 29, 11, 30))
    const { result } = renderHook(() => useNow(), { wrapper })

    expect(result.current.getHours()).toBe(11)

    act(() => {
      vi.advanceTimersByTime(HALF_HOUR_MS + 5_000)
    })

    expect(result.current.getHours()).toBe(12)
  })

  it('deja de escuchar al desmontarse', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useNow(), { wrapper })

    unmount()

    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})
