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
    // **Se mira cómo estaba la tarjeta en el momento de guardar**, no después.
    //
    // Comprobarlo tras el clic era una carrera perdida: la tarjeta espera 200
    // ms a irse antes de guardar, y en la tanda completa el clic tardaba a
    // veces más que eso, así que el guardado ya había ocurrido y la prueba
    // fallaba sin que nada estuviera roto. Preguntándolo desde dentro del
    // guardado se comprueba justo lo que se quiere —que para entonces ya se
    // estaba yendo— y da igual lo que tarde cada paso.
    const user = userEvent.setup()
    let seIbaAlGuardar: boolean | null = null
    const onDismiss = vi.fn(() => {
      seIbaAlGuardar = isLeaving()
      return Promise.resolve()
    })

    renderCard(onDismiss)
    await user.click(screen.getByRole('button', { name: /Descartar/ }))

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledOnce()
    })

    // El orden es lo que se prueba: si se guardara primero, el plan se
    // refrescaría y la tarjeta se desmontaría sin que diera tiempo a verla irse.
    expect(seIbaAlGuardar).toBe(true)
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
