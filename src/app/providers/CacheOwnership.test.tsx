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
const session = vi.hoisted(() => ({
  status: 'loading' as AuthStatus,
  userId: undefined as string | undefined,
}))

vi.mock('@/core/auth', () => ({
  useAuth: () => ({
    status: session.status,
    user: session.userId ? { id: session.userId } : null,
  }),
}))

/** El disco, en un objeto: lo que sobrevive entre sesiones. */
const disk = vi.hoisted(() => ({ owner: null as string | null, cache: null as string | null }))

const clearPersistedCache = vi.hoisted(() =>
  vi.fn(() => {
    disk.owner = null
    disk.cache = null
  }),
)

vi.mock('./query-persister', () => ({
  clearPersistedCache,
  hasPersistedCache: () => disk.cache !== null,
  readCacheOwner: () => disk.owner,
  writeCacheOwner: (userId: string) => {
    disk.owner = userId
  },
}))

const STALE_KEY = ['algo-de-la-sesion-anterior']

const ANA = 'ana-uuid'
const BRUNO = 'bruno-uuid'

interface Scenario {
  readonly status: AuthStatus
  readonly userId?: string
  /** Quién firmó lo que hay guardado en el dispositivo. */
  readonly owner?: string | null
}

function renderWith({ status, userId, owner = null }: Scenario) {
  session.status = status
  session.userId = userId
  disk.owner = owner
  disk.cache = owner === null ? null : 'algo'

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
    const queryClient = renderWith({ status: 'unauthenticated', owner: ANA })

    expect(queryClient.getQueryData(STALE_KEY)).toBeUndefined()
    expect(clearPersistedCache).toHaveBeenCalledOnce()
  })

  it('con su propia caché no toca nada', () => {
    const queryClient = renderWith({ status: 'authenticated', userId: ANA, owner: ANA })

    expect(queryClient.getQueryData(STALE_KEY)).toEqual({ peso: 90 })
    expect(clearPersistedCache).not.toHaveBeenCalled()
  })

  it('tira la caché que dejó otra persona', () => {
    // El caso que trae el segundo usuario: dos cuentas, un mismo ordenador.
    // Nadie tiene por qué haber pasado por «cerrar sesión» para llegar aquí.
    const queryClient = renderWith({ status: 'authenticated', userId: BRUNO, owner: ANA })

    expect(queryClient.getQueryData(STALE_KEY)).toBeUndefined()
    expect(clearPersistedCache).toHaveBeenCalledOnce()
    expect(disk.owner).toBe(BRUNO)
  })

  it('firma la caché de quien entra por primera vez, sin tirar nada', () => {
    // No había nada guardado, así que vaciar aquí sólo obligaría a las pantallas
    // a volver a pedir lo que acaban de pedir.
    const queryClient = renderWith({ status: 'authenticated', userId: ANA, owner: null })

    expect(queryClient.getQueryData(STALE_KEY)).toEqual({ peso: 90 })
    expect(clearPersistedCache).not.toHaveBeenCalled()
    expect(disk.owner).toBe(ANA)
  })

  it('mientras comprueba la sesión no hace nada', () => {
    // Borrar en `loading` vaciaría la caché en cada arranque, que es lo
    // contrario de lo que se busca al persistirla.
    const queryClient = renderWith({ status: 'loading', owner: ANA })

    expect(queryClient.getQueryData(STALE_KEY)).toEqual({ peso: 90 })
    expect(clearPersistedCache).not.toHaveBeenCalled()
    expect(disk.owner).toBe(ANA)
  })

  it('deja pasar a sus hijos', () => {
    renderWith({ status: 'authenticated', userId: ANA, owner: ANA })

    expect(document.body.textContent).toContain('contenido')
  })
})
