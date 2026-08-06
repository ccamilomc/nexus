import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { InstallAvailability } from '@/shared/hooks/use-install-prompt'

import { InstallBanner } from './InstallBanner'

const availability = vi.hoisted(() => ({ current: 'ready' as InstallAvailability }))
const install = vi.hoisted(() => vi.fn(() => Promise.resolve()))

vi.mock('@/shared/hooks/use-install-prompt', () => ({
  useInstallPrompt: () => ({ availability: availability.current, install }),
}))

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
  availability.current = 'ready'
})

describe('InstallBanner', () => {
  it('ofrece instalar cuando hay un botón que de verdad instala', async () => {
    render(<InstallBanner />)

    await userEvent.click(screen.getByRole('button', { name: 'Instalar' }))

    expect(install).toHaveBeenCalledOnce()
  })

  it('descartado no vuelve, ni ahora ni al abrir de nuevo la aplicación', async () => {
    const { unmount } = render(<InstallBanner />)

    await userEvent.click(screen.getByRole('button', { name: 'Ahora no' }))

    expect(screen.queryByRole('button', { name: 'Instalar' })).not.toBeInTheDocument()

    // Volver a montarlo es lo que pasa al reabrir la aplicación: si el «ahora
    // no» sólo viviera en memoria, el aviso reaparecería cada vez. Eso es
    // exactamente la insistencia que se quiso evitar.
    unmount()
    render(<InstallBanner />)

    expect(screen.queryByRole('button', { name: 'Instalar' })).not.toBeInTheDocument()
  })

  it('en iPhone no estorba: sus dos toques se explican en Ajustes', () => {
    availability.current = 'manual'

    const { container } = render(<InstallBanner />)

    expect(container).toBeEmptyDOMElement()
  })

  it('no ofrece instalar lo que ya está instalado', () => {
    availability.current = 'installed'

    const { container } = render(<InstallBanner />)

    expect(container).toBeEmptyDOMElement()
  })
})
