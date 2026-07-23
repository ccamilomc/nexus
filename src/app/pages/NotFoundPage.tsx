import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { EmptyState } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Esta página no existe"
      description="Puede que el enlace haya cambiado o que la dirección esté mal escrita."
      action={
        <Button asChild>
          <Link to={ROUTES.dashboard}>Volver al inicio</Link>
        </Button>
      }
    />
  )
}
