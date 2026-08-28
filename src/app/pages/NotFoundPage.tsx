import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { PageHeader } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui/button'

/**
 * La dirección no existe.
 *
 * **Va con `PageHeader` y no con `EmptyState`**, que es lo que había: un estado
 * vacío es un hueco *dentro* de una pantalla y por eso su título es un `h2`.
 * Aquí no hay pantalla alrededor —esto **es** la pantalla—, así que sin `h1`
 * quedaba la única página de la aplicación sin encabezado de primer nivel, y
 * quien navegue con lector de pantalla se queda sin saber dónde cayó.
 */
export function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Esta página no existe"
        description="Puede que el enlace haya cambiado o que la dirección esté mal escrita."
      />
      <Button asChild>
        <Link to={ROUTES.today}>Volver al inicio</Link>
      </Button>
    </>
  )
}
