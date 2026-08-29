import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyState } from '@/shared/components/feedback'
import { expectNoAccessibilityIssues } from '@/test/accessibility'

import { Button } from './button'
import { ConfirmButton } from './confirm-button'
import { Input } from './input'
import { Label } from './label'
import { MoneyInput } from './money-input'
import { Progress } from './progress'
import { Select } from './select'

/**
 * El examen de axe sobre las piezas que se repiten en toda la aplicación.
 *
 * **Se prueban las piezas y no las pantallas** porque un fallo aquí sale
 * multiplicado: un campo sin etiqueta en `Input` son cuarenta campos sin
 * etiqueta. Las pantallas se siguen mirando a mano, que es donde aparece lo que
 * una máquina no ve.
 */
describe('las piezas compartidas pasan el examen de axe', () => {
  it('un botón', async () => {
    const { container } = render(<Button>Guardar</Button>)
    await expectNoAccessibilityIssues(container)
  })

  it('un botón que sólo lleva icono tiene que decir qué hace', async () => {
    const { container } = render(
      <Button size="icon" aria-label="Quitar el movimiento">
        <span aria-hidden>×</span>
      </Button>,
    )
    await expectNoAccessibilityIssues(container)
  })

  it('un campo con su etiqueta', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="monto">Monto</Label>
        <Input id="monto" />
      </div>,
    )
    await expectNoAccessibilityIssues(container)
  })

  it('un campo de dinero', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="dinero">Cuánto</Label>
        <MoneyInput id="dinero" value={164_800} onChange={() => {}} />
      </div>,
    )
    await expectNoAccessibilityIssues(container)
  })

  it('un desplegable con su etiqueta', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="cuenta">Cuenta</Label>
        <Select id="cuenta" defaultValue="a">
          <option value="a">Efectivo</option>
          <option value="b">Nequi</option>
        </Select>
      </div>,
    )
    await expectNoAccessibilityIssues(container)
  })

  it('una barra de progreso', async () => {
    const { container } = render(<Progress value={40} label="Presupuesto del mes" />)
    await expectNoAccessibilityIssues(container)
  })

  it('el botón que pide confirmación', async () => {
    const { container } = render(
      <ConfirmButton label="Quitar" confirmLabel="Sí, quitar" onConfirm={() => {}} />,
    )
    await expectNoAccessibilityIssues(container)
  })

  it('un estado vacío', async () => {
    const { container } = render(
      <EmptyState title="No hay nada" description="Apunta el primero." />,
    )
    await expectNoAccessibilityIssues(container)
  })
})

describe('el examen sirve de algo', () => {
  it('caza un campo sin etiqueta', async () => {
    // Sin esta prueba, todo lo de arriba podria estar pasando por no mirar.
    const { container } = render(<Input id="huerfano" />)

    await expect(expectNoAccessibilityIssues(container)).rejects.toThrow(/accesibilidad/)
  })

  it('caza un botón que no dice qué hace', async () => {
    const { container } = render(
      <Button size="icon">
        <span aria-hidden>×</span>
      </Button>,
    )

    await expect(expectNoAccessibilityIssues(container)).rejects.toThrow(/accesibilidad/)
  })
})
