import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToday } from './use-today'

/** 29 de julio de 2026, a las once y media de la noche (hora local). */
const LATE_NIGHT = new Date(2026, 6, 29, 23, 30)
const HALF_HOUR_MS = 30 * 60 * 1000
/** Media hora y pico: lo justo para dejar atrás la medianoche y su margen. */
const PAST_MIDNIGHT_MS = HALF_HOUR_MS + 5_000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(LATE_NIGHT)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToday', () => {
  it('devuelve el día actual a medianoche, no el instante', () => {
    const { result } = renderHook(() => useToday())

    expect(result.current).toEqual(new Date(2026, 6, 29))
  })

  it('cambia de día al pasar la medianoche con la pantalla abierta', () => {
    const { result } = renderHook(() => useToday())

    act(() => {
      vi.advanceTimersByTime(PAST_MIDNIGHT_MS)
    })

    expect(result.current).toEqual(new Date(2026, 6, 30))
  })

  it('mantiene la misma referencia mientras no cambie el día', () => {
    const { result, rerender } = renderHook(() => useToday())
    const first = result.current

    rerender()
    act(() => {
      vi.advanceTimersByTime(HALF_HOUR_MS / 2)
    })

    // Sirve como dependencia y como clave de consulta sin trabajo de más.
    expect(result.current).toBe(first)
  })

  it('se pone al día al volver a la aplicación', () => {
    // En el móvil los temporizadores no corren con la pantalla apagada: al
    // volver, la fecha tiene que ponerse al día igualmente.
    const { result } = renderHook(() => useToday())

    act(() => {
      vi.setSystemTime(new Date(2026, 6, 31, 9, 0))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toEqual(new Date(2026, 6, 31))
  })

  it('deja de escuchar al desmontarse', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useToday())

    unmount()

    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})
