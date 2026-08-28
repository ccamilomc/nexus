import { useState } from 'react'

import { useAuth } from '@/core/auth'
import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface SignInWithLinkProps {
  /** El correo que ya escribió arriba, para no pedirlo dos veces. */
  readonly email: string
  readonly onEmailChange: (email: string) => void
  readonly onCancel: () => void
}

/**
 * Entrar sin contraseña: llega un enlace al correo y con tocarlo se entra.
 *
 * Existe porque **escribir una contraseña en el teléfono es lo que hace odiar
 * esta pantalla**, y no la frecuencia con que aparece. Con el enlace se escribe
 * el correo —que el navegador ya autocompleta— y nada más.
 *
 * **La respuesta es siempre la misma, exista o no la cuenta.** Decir «ese correo
 * no está registrado» convertiría esta pantalla en una forma de averiguar quién
 * tiene cuenta, y no hace falta para nada: quien se equivoque de correo
 * simplemente no recibirá el enlace.
 */
export function SignInWithLink({ email, onEmailChange, onCancel }: SignInWithLinkProps) {
  const { requestSignInLink } = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    if (!email.trim()) {
      setError('Escribe tu correo.')
      return
    }

    setError(null)
    setIsSending(true)
    try {
      await requestSignInLink(email.trim(), `${window.location.origin}/`)
      setIsSent(true)
    } catch {
      // Ni siquiera aquí se distingue: un fallo de red y un correo sin cuenta se
      // cuentan igual, y lo único accionable es volver a intentarlo.
      setError('No hemos podido enviar el enlace. Inténtalo de nuevo en un momento.')
    } finally {
      setIsSending(false)
    }
  }

  if (isSent) {
    return (
      <div className="space-y-3">
        <p className="font-medium">Revisa tu correo</p>
        <p className="text-sm text-muted-foreground">
          Si <span className="text-foreground">{email.trim()}</span> tiene cuenta, le acaba de
          llegar un enlace. Ábrelo desde este mismo teléfono y entrarás sin escribir nada más.
        </p>
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Entrar con contraseña
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? <FormAlert>{error}</FormAlert> : null}

      <FormField id="email-enlace" label="Correo">
        <Input
          id="email-enlace"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </FormField>

      <p className="text-xs text-muted-foreground">
        Te mandamos un enlace y entras con tocarlo. Sin contraseña.
      </p>

      <div className="space-y-2">
        <Button type="button" className="w-full" disabled={isSending} onClick={() => void send()}>
          {isSending ? 'Enviando…' : 'Mandarme el enlace'}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Prefiero usar mi contraseña
        </Button>
      </div>
    </div>
  )
}
