import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { act, type PropsWithChildren } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { OFFLINE_MUTATIONS } from '@/core/offline'

import { OfflineBanner } from './OfflineBanner'

/**
 * Se manipula el `onlineManager` de TanStack y no `navigator.onLine` porque es
 * él quien pausa las escrituras: el aviso tiene que contar lo que de verdad
 * está esperando, no lo que crea el navegador.
 */
function setOnline(isOnline: boolean) {
  act(() => onlineManager.setOnline(isOnline))
}

/** Deja `n` registros esperando red, como los deja tocar el botón sin señal. */
function withPending(n: number) {
  const client = new QueryClient()
  client.setMutationDefaults(OFFLINE_MUTATIONS.addWater, { mutationFn: () => Promise.resolve() })

  for (let i = 0; i < n; i += 1) {
    void client
      .getMutationCache()
      .build(client, { mutationKey: OFFLINE_MUTATIONS.addWater })
      .execute({ userId: 'u1' })
  }

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

afterEach(() => {
  setOnline(true)
})

describe('OfflineBanner', () => {
  it('con conexión no dice nada', () => {
    setOnline(true)
    render(<OfflineBanner />, { wrapper: withPending(0) })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('sin nada apuntado avisa de lo que puede faltar por ver', () => {
    setOnline(false)
    render(<OfflineBanner />, { wrapper: withPending(0) })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sin conexión. Puede que no veas lo más reciente.',
    )
  })

  it('con algo apuntado contesta la pregunta que de verdad importa: no se ha perdido', () => {
    setOnline(false)
    render(<OfflineBanner />, { wrapper: withPending(1) })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sin conexión. 1 registro guardado, se envía al volver.',
    )
  })

  it('con varios lo dice en plural', () => {
    setOnline(false)
    render(<OfflineBanner />, { wrapper: withPending(3) })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sin conexión. 3 registros guardados, se envían al volver.',
    )
  })
})
