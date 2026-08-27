import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useAuth } from '@/core/auth'
import { createAppError, isAppError } from '@/core/error'
import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { WIDE_TAP_AREA } from '@/shared/constants'
import { cn } from '@/shared/lib/utils'

import { AuthShell } from '../components/AuthShell'
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas/auth.schema'

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    try {
      const redirectTo = `${window.location.origin}${ROUTES.resetPassword}`
      await requestPasswordReset(email, redirectTo)
      setSent(true)
    } catch (error) {
      setFormError(isAppError(error) ? error.message : createAppError('unknown').message)
    }
  })

  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle={sent ? undefined : 'Te enviaremos un enlace para restablecerla'}
      footer={
        <Link
          to={ROUTES.login}
          className={cn(WIDE_TAP_AREA, `font-medium text-foreground hover:underline`)}
        >
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <FormAlert variant="success">
          Si el correo está registrado, recibirás un enlace para crear una contraseña nueva.
        </FormAlert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <FormField id="email" label="Correo" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
