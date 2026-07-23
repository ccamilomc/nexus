import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useAuth } from '@/core/auth'
import { createAppError, isAppError } from '@/core/error'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

import { AuthShell } from '../components/AuthShell'
import { FormAlert } from '../components/FormAlert'
import { FormField } from '../components/FormField'
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas/auth.schema'

export function ResetPasswordPage() {
  const { status, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null)
    try {
      await updatePassword(password)
      navigate(ROUTES.dashboard, { replace: true })
    } catch (error) {
      setFormError(isAppError(error) ? error.message : createAppError('unknown').message)
    }
  })

  // El enlace del correo abre una sesión de recuperación. Sin ella, no hay nada que hacer.
  if (status === 'unauthenticated') {
    return (
      <AuthShell
        title="Enlace no válido"
        subtitle="El enlace de recuperación caducó o ya se usó."
        footer={
          <Link to={ROUTES.forgotPassword} className="font-medium text-foreground hover:underline">
            Solicitar uno nuevo
          </Link>
        }
      >
        <FormAlert>Vuelve a pedir el enlace de recuperación para continuar.</FormAlert>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Crea una contraseña nueva" subtitle="Elige una contraseña segura">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <FormAlert>{formError}</FormAlert> : null}

        <FormField id="password" label="Nueva contraseña" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>

        <FormField id="confirm" label="Repite la contraseña" error={errors.confirm?.message}>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm)}
            {...register('confirm')}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </form>
    </AuthShell>
  )
}
