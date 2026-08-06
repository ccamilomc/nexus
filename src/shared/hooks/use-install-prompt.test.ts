import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { InstallPrompt } from './use-install-prompt'

/**
 * El módulo guarda el aviso del navegador en una variable suya y se pone a
 * escuchar al cargarse, así que cada test necesita una copia limpia: sin esto,
 * el aviso de un test seguiría ahí en el siguiente.
 */
async function loadHook() {
  vi.resetModules()

  const { useInstallPrompt } = await import('./use-install-prompt')

  return renderHook(() => useInstallPrompt())
}

interface OfferOptions {
  readonly prompt?: () => Promise<void>
}

/** Lo que hace Chromium cuando decide que la aplicación se puede instalar. */
function offerInstall({ prompt = () => Promise.resolve() }: OfferOptions = {}) {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  })

  act(() => {
    window.dispatchEvent(event)
  })

  return event
}

/** Finge que la aplicación corre instalada, no dentro de una pestaña. */
function runInstalled(): void {
  vi.spyOn(window, 'matchMedia').mockReturnValue(
    // Sobre un `EventTarget` de verdad para no tener que forzar el tipo: aporta
    // los tres métodos de escucha y aquí se completa el resto.
    Object.assign(new EventTarget(), {
      matches: true,
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  )
}

function runOnIphone(): void {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  )
}

/** Espera a que la promesa de `install()` termine sin dejar avisos de React. */
async function install(result: { current: InstallPrompt }): Promise<void> {
  await act(async () => {
    await result.current.install()
  })
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useInstallPrompt', () => {
  it('no ofrece nada mientras el navegador no lo ofrezca', async () => {
    const { result } = await loadHook()

    expect(result.current.availability).toBe('unavailable')
  })

  it('ofrece instalar en cuanto el navegador avisa, y le quita el aviso de las manos', async () => {
    const { result } = await loadHook()

    const event = offerInstall()

    expect(result.current.availability).toBe('ready')
    // Sin `preventDefault` Chromium enseña su propia barra cuando le apetece, y
    // la aplicación pierde el control del momento (docs/13).
    expect(event.defaultPrevented).toBe(true)
  })

  it('el aviso sobrevive a que se desmonte quien lo estaba enseñando', async () => {
    // Es el motivo de que el listener viva en el módulo y no en un efecto: la
    // tarjeta del Dashboard se desmonta al navegar a otra pantalla, y el
    // navegador **no** vuelve a avisar. Con un listener por componente, volver
    // al Dashboard dejaba de ofrecer instalar para siempre.
    const { useInstallPrompt } = await (async () => {
      vi.resetModules()

      return import('./use-install-prompt')
    })()

    const first = renderHook(() => useInstallPrompt())
    offerInstall()
    expect(first.result.current.availability).toBe('ready')

    first.unmount()

    const second = renderHook(() => useInstallPrompt())
    expect(second.result.current.availability).toBe('ready')
  })

  it('al instalar abre el diálogo y deja de ofrecerlo', async () => {
    const prompt = vi.fn(() => Promise.resolve())
    const { result } = await loadHook()
    offerInstall({ prompt })

    await install(result)

    expect(prompt).toHaveBeenCalledOnce()
    // El aviso se gasta al usarlo: Chromium no deja llamarlo dos veces, así que
    // el botón tiene que desaparecer.
    expect(result.current.availability).toBe('unavailable')
  })

  it('si el diálogo no llega a abrirse, se puede volver a intentar', async () => {
    const prompt = vi.fn(() => Promise.reject(new Error('sin gesto del usuario')))
    const { result } = await loadHook()
    offerInstall({ prompt })

    await install(result)

    // Lo que no se gastó no se pierde: dejar la aplicación sin forma de
    // instalarse por un fallo del navegador sería peor que el fallo.
    expect(result.current.availability).toBe('ready')
  })

  it('deja de ofrecerlo en cuanto se instala, aunque sea desde el navegador', async () => {
    const { result } = await loadHook()
    offerInstall()

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(result.current.availability).toBe('unavailable')
  })

  it('no ofrece instalar lo que ya está instalado', async () => {
    runInstalled()

    const { result } = await loadHook()
    offerInstall()

    expect(result.current.availability).toBe('installed')
  })

  it('en iPhone explica en vez de prometer un botón que allí no existe', async () => {
    runOnIphone()

    const { result } = await loadHook()

    expect(result.current.availability).toBe('manual')
  })
})
