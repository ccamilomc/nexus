import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Recommendation } from '@/decision-engine'

import { RecommendationCard } from './RecommendationCard'

const RECOMMENDATION: Recommendation = {
  key: 'water-behind',
  type: 'alert',
  domain: 'nutrition',
  priority: 'medium',
  title: 'Te falta agua',
  message: 'Bebe 2 L para llegar a tu objetivo de hoy.',
  reason: 'Llevas 0 ml de 2 L.',
  data: {},
}

/** La tarjeta que se está yendo es la que se ha vuelto transparente. */
function isLeaving(): boolean {
  const card = screen.getByText('Te falta agua').closest('div.rounded-xl')

  return card?.className.includes('opacity-0') ?? false
}

function renderCard(onDismiss: () => Promise<void>) {
  return render(
    <RecommendationCard
      recommendation={RECOMMENDATION}
      onDismiss={onDismiss}
      isDismissing={false}
    />,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('RecommendationCard', () => {
  it('enseña el motivo junto al consejo', () => {
    renderCard(() => Promise.resolve())

    expect(screen.getByText('Llevas 0 ml de 2 L.')).toBeInTheDocument()
  })

  it('se aparta antes de guardar el descarte', async () => {
    const user = userEvent.setup()
    let dismissed = false
    const onDismiss = vi.fn(() => {
      dismissed = true
      return Promise.resolve()
    })

    renderCard(onDismiss)
    await user.click(screen.getByRole('button', { name: /Descartar/ }))

    // El orden es lo que se prueba: si se guardara primero, el plan se
    // refrescaría y la tarjeta se desmontaría sin que diera tiempo a verla irse.
    expect(isLeaving()).toBe(true)
    expect(dismissed).toBe(false)

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledOnce()
    })
  })

  it('vuelve si el descarte no se pudo guardar', async () => {
    const user = userEvent.setup()

    renderCard(() => Promise.reject(new Error('sin conexión')))
    await user.click(screen.getByRole('button', { name: /Descartar/ }))

    await waitFor(() => {
      expect(isLeaving()).toBe(false)
    })
    // Y se puede volver a intentar: quedaría inservible si no.
    expect(screen.getByRole('button', { name: /Descartar/ })).toBeEnabled()
  })

  it('no hace esperar a quien pidió menos movimiento', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(
      Object.assign(new EventTarget(), {
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
      }) as MediaQueryList,
    )

    const user = userEvent.setup()
    const onDismiss = vi.fn(() => Promise.resolve())

    renderCard(onDismiss)
    await user.click(screen.getByRole('button', { name: /Descartar/ }))

    // Sin pausa: no hay animación que esperar, así que esperarla sería sólo
    // retrasar el guardado.
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
