import { LogOut } from 'lucide-react'

import { useAuth } from '@/core/auth'
import { Button } from '@/shared/components/ui/button'

/** Identidad del usuario y cierre de sesión. Se muestra en la barra lateral. */
export function UserMenu() {
  const { user, signOut } = useAuth()

  const displayName =
    typeof user?.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : undefined
  const label = displayName ?? user?.email ?? 'Cuenta'

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground" title={label}>
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cerrar sesión"
        onClick={() => {
          void signOut()
        }}
      >
        <LogOut />
      </Button>
    </div>
  )
}
