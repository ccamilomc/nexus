import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNearViewport } from './use-near-viewport'

/** Los avisos que el hook ha registrado, para dispararlos cuando toque. */
let callbacks: IntersectionObserverCallback[] = []
let disconnects = 0

/**
 * Un observador de mentira que no avisa por su cuenta.
 *
 * jsdom no trae `IntersectionObserver` y tampoco calcula posiciones, así que
 * cada test decide qué se ve y cuándo, que es justo lo que hay que probar.
 */
function installObserver(): void {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback)
      }
      observe(): void {}
      disconnect(): void {
        disconnects += 1
      }
      unobserve(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return []
      }
    },
  )
}

/** Lo que hace el navegador al observar y cada vez que la posición cambia. */
function report(isIntersecting: boolean): void {
  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
    }
  })
}

/**
 * Una sonda con el `ref` puesto de verdad.
 *
 * El hook no observa nada hasta tener un nodo, y sólo React lo coloca a tiempo:
 * asignarlo a mano después del render llegaría tarde al efecto.
 */
function Probe() {
  const { ref, isNear } = useNearViewport<HTMLDivElement>()

  return <div ref={ref}>{isNear ? 'montado' : 'esperando'}</div>
}

function isMounted(): boolean {
  return screen.queryByText('montado') !== null
}

beforeEach(() => {
  callbacks = []
  disconnects = 0
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useNearViewport', () => {
  it('espera mientras el elemento queda lejos y monta cuando se acerca', () => {
    installObserver()
    render(<Probe />)

    report(false)
    expect(isMounted()).toBe(false)

    report(true)
    expect(isMounted()).toBe(true)
  })

  it('sigue esperando por mucho que pase el tiempo, si el observador contesta', () => {
    installObserver()
    render(<Probe />)

    report(false)
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    // «Lejos» es una respuesta buena: montar aquí anularía el aplazamiento.
    expect(isMounted()).toBe(false)
  })

  it('monta igualmente si el observador no contesta nunca', () => {
    installObserver()
    render(<Probe />)

    expect(isMounted()).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(isMounted()).toBe(true)
  })

  it('monta de entrada donde no hay IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    render(<Probe />)

    expect(isMounted()).toBe(true)
  })

  it('no vuelve atrás cuando el elemento se aleja', () => {
    installObserver()
    render(<Probe />)

    report(true)
    report(false)

    expect(isMounted()).toBe(true)
  })

  it('suelta el observador al desmontar', () => {
    installObserver()
    const view = render(<Probe />)

    view.unmount()

    expect(disconnects).toBeGreaterThan(0)
  })
})
