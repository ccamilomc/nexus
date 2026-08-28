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
import { SignInWithLink } from '../components/SignInWithLink'
import { loginSchema, type LoginValues } from '../schemas/auth.schema'

export function LoginPage() {
  const { signIn } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  // Arranca en el enlace, no en la contraseña: es lo que se pidió para no
  // tener que teclearla en el teléfono. Quien la prefiera la tiene a un toque.
  const [conEnlace, setConEnlace] = useState(true)
  const [correo, setCorreo] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signIn(values)
      // La redirección al dashboard la resuelve RedirectIfAuth al cambiar la sesión.
    } catch (error) {
      setFormError(isAppError(error) ? error.message : createAppError('unknown').message)
    }
  })

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Ingresa a tu cuenta de Nexus"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link
            to={ROUTES.register}
            className={cn(WIDE_TAP_AREA, `font-medium text-foreground hover:underline`)}
          >
            Crea una
          </Link>
        </>
      }
    >
      {conEnlace ? (
        <SignInWithLink
          email={correo}
          onEmailChange={setCorreo}
          onCancel={() => setConEnlace(false)}
        />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {formError ? <FormAlert>{formError}</FormAlert> : null}

          {/* El teclado del telefono pone mayuscula a la primera letra y subraya
            el correo como si estuviera mal escrito. Un correo con mayuscula
            inicial no entra, y corregirlo a mano cada vez es justo la friccion
            que hace odiar esta pantalla. */}
          <FormField id="email" label="Correo" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <FormField id="password" label="Contraseña" error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </FormField>

          <div className="text-right">
            <Link
              to={ROUTES.forgotPassword}
              className={cn(
                WIDE_TAP_AREA,
                `text-xs text-muted-foreground hover:text-foreground hover:underline`,
              )}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setConEnlace(true)}
          >
            Entrar sin contraseña
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
