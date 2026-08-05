import { onlineManager } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { SkeletonList } from './Skeleton'

/**
 * Se manipula el `onlineManager` de TanStack y no `navigator.onLine` porque es
 * él quien pausa las consultas: si la pantalla mirase otra cosa, podría decir
 * «ya hay señal» sobre datos que siguen dormidos.
 */
function setOnline(isOnline: boolean) {
  act(() => onlineManager.setOnline(isOnline))
}

afterEach(() => {
  setOnline(true)
})

describe('SkeletonList', () => {
  it('con conexión muestra que el contenido viene en camino', () => {
    setOnline(true)
    render(<SkeletonList label="Cargando tu sueño" rows={3} />)

    expect(screen.getByRole('status', { name: 'Cargando tu sueño' })).toBeInTheDocument()
    expect(screen.queryByText('Sin conexión')).not.toBeInTheDocument()
  })

  it('sin conexión lo dice en vez de latir indefinidamente', () => {
    // TanStack no falla cuando se cae la red: pausa la consulta. Sin error que
    // mostrar, la pantalla se quedaba con los bloques girando para siempre.
    setOnline(false)
    render(<SkeletonList label="Cargando tu sueño" rows={3} />)

    expect(screen.getByText('Sin conexión')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Cargando tu sueño' })).not.toBeInTheDocument()
  })

  it('no promete nada que no se haya comprobado', () => {
    // Ni guardar ni sincronizar (la cola llega en el Sprint 14), ni recuperarse
    // sola: se probó a devolver la señal con la pantalla abierta y las
    // consultas pausadas no reanudaron. Recargar sí funciona, y eso es lo que
    // se pide.
    setOnline(false)
    render(<SkeletonList label="Cargando" />)

    const description = screen.getByText(/vuelve a intentarlo/i)

    expect(description.textContent).not.toMatch(/guardar|sincroniz|enviar|solo|automátic/i)
  })

  it('vuelve a los bloques de carga en cuanto regresa la señal', () => {
    setOnline(false)
    render(<SkeletonList label="Cargando tu sueño" />)
    expect(screen.getByText('Sin conexión')).toBeInTheDocument()

    // TanStack reanuda sola la consulta pausada; la pantalla debe acompañarla.
    setOnline(true)

    expect(screen.getByRole('status', { name: 'Cargando tu sueño' })).toBeInTheDocument()
    expect(screen.queryByText('Sin conexión')).not.toBeInTheDocument()
  })
})
