import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthStatus } from '@/core/auth'

import { CacheOwnership } from './CacheOwnership'

/**
 * `@/core/auth` se dobla entero: importarlo de verdad arrastra el cliente de
 * Supabase, que valida las variables de entorno al cargarse y revienta en CI
 * (ver la memoria del proyecto y el PR #46).
 */
const status = vi.hoisted(() => ({ current: 'loading' as AuthStatus }))

vi.mock('@/core/auth', () => ({
  useAuth: () => ({ status: status.current }),
}))

const clearPersistedCache = vi.hoisted(() => vi.fn())

vi.mock('./query-persister', () => ({ clearPersistedCache }))

const STALE_KEY = ['algo-de-la-sesion-anterior']

function renderWith(current: AuthStatus) {
  status.current = current

  const queryClient = new QueryClient()
  queryClient.setQueryData(STALE_KEY, { peso: 90 })

  function wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  render(
    <CacheOwnership>
      <span>contenido</span>
    </CacheOwnership>,
    { wrapper },
  )

  return queryClient
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CacheOwnership', () => {
  it('sin sesión no deja rastro: ni en memoria ni en el dispositivo', () => {
    // Es el requisito de seguridad: la RLS protege el servidor, no el disco.
    const queryClient = renderWith('unauthenticated')

    expect(queryClient.getQueryData(STALE_KEY)).toBeUndefined()
    expect(clearPersistedCache).toHaveBeenCalledOnce()
  })

  it('con sesión abierta no toca nada', () => {
    const queryClient = renderWith('authenticated')

    expect(queryClient.getQueryData(STALE_KEY)).toEqual({ peso: 90 })
    expect(clearPersistedCache).not.toHaveBeenCalled()
  })

  it('mientras comprueba la sesión tampoco', () => {
    // Borrar en `loading` vaciaría la caché en cada arranque, que es lo
    // contrario de lo que se busca al persistirla.
    const queryClient = renderWith('loading')

    expect(queryClient.getQueryData(STALE_KEY)).toEqual({ peso: 90 })
    expect(clearPersistedCache).not.toHaveBeenCalled()
  })

  it('deja pasar a sus hijos', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <CacheOwnership>
          <span>contenido</span>
        </CacheOwnership>
      </QueryClientProvider>,
    )

    expect(container.textContent).toBe('contenido')
  })
})
