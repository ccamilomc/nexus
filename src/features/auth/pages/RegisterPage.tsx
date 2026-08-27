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
import { PasswordInput } from '@/shared/components/ui/password-input'
import { WIDE_TAP_AREA } from '@/shared/constants'
import { cn } from '@/shared/lib/utils'

import { AuthShell } from '../components/AuthShell'
import { registerSchema, type RegisterValues } from '../schemas/auth.schema'

export function RegisterPage() {
  const { signUp } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const { needsConfirmation } = await signUp(values)
      if (needsConfirmation) setConfirmationSent(true)
      // Si no requiere confirmación, RedirectIfAuth lleva al dashboard.
    } catch (error) {
      setFormError(isAppError(error) ? error.message : createAppError('unknown').message)
    }
  })

  if (confirmationSent) {
    return (
      <AuthShell
        title="Revisa tu correo"
        subtitle="Te enviamos un enlace para confirmar tu cuenta."
        footer={
          <Link
            to={ROUTES.login}
            className={cn(WIDE_TAP_AREA, `font-medium text-foreground hover:underline`)}
          >
            Volver a iniciar sesión
          </Link>
        }
      >
        <FormAlert variant="success">
          Abre el enlace del correo para activar tu cuenta y luego inicia sesión.
        </FormAlert>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza a organizar tu vida con Nexus"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link
            to={ROUTES.login}
            className={cn(WIDE_TAP_AREA, `font-medium text-foreground hover:underline`)}
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <FormAlert>{formError}</FormAlert> : null}

        <FormField id="displayName" label="Nombre (opcional)" error={errors.displayName?.message}>
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.displayName)}
            {...register('displayName')}
          />
        </FormField>

        <FormField id="email" label="Correo" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>

        <FormField id="password" label="Contraseña" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthShell>
  )
}
