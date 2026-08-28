import * as React from 'react'
import { type Control, type FieldPath, type FieldValues, useController } from 'react-hook-form'

import { caretAfterFormat, digitsBefore, formatMoneyInput, parseMoneyInput } from '@/shared/utils'

import { Input } from './input'

interface MoneyInputProps extends Omit<
  React.ComponentProps<'input'>,
  'value' | 'onChange' | 'type'
> {
  /** La cifra escrita. Vacío es `NaN`, `null` o `undefined`, según el esquema. */
  readonly value: number | null | undefined
  readonly onChange: (value: number) => void
  /** Un saldo inicial puede ser negativo: una tarjeta empieza debiendo. */
  readonly allowNegative?: boolean
}

/** Vacío se dice de tres maneras según el esquema, y las tres son vacío. */
function isEmptyAmount(value: number | null | undefined): boolean {
  return value === null || value === undefined || !Number.isFinite(value)
}

/** `NaN === NaN` es falso, y aquí los dos vacíos son el mismo vacío. */
function isSameAmount(a: number | null | undefined, b: number | null | undefined): boolean {
  return isEmptyAmount(a) && isEmptyAmount(b) ? true : a === b
}

function toDisplay(value: number | null | undefined, allowNegative: boolean): string {
  return isEmptyAmount(value) ? '' : formatMoneyInput(String(value), allowNegative)
}

/**
 * Un campo de dinero que se agrupa mientras se escribe: 1000 se ve «1.000».
 *
 * **No es cosmético.** Un cero de más en «1000000» no se ve; en «1.000.000» sí,
 * y es el error que más caro sale al apuntar un gasto.
 *
 * Va como texto y no como `type="number"`, porque un campo numérico **no puede**
 * enseñar separadores: el navegador sólo admite ahí un número válido, y leería
 * el punto como decimal. El teclado del móvil sigue siendo el numérico gracias a
 * `inputMode`, que es lo que de verdad lo decide.
 *
 * El cursor se recoloca contando dígitos y no caracteres. Sin eso, al escribir
 * el cuarto dígito aparece un punto, todo se corre un sitio y corregir un cero
 * en medio de la cifra se vuelve imposible.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, allowNegative = false, ...props }, forwardedRef) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const caretRef = React.useRef<number | null>(null)
    const [draft, setDraft] = React.useState(() => toDisplay(value, allowNegative))

    // El texto se rehace sólo cuando la cifra cambia **por fuera** —corregir un
    // movimiento, vaciar el formulario—. Si viene de teclear ya coincide, y
    // rehacerlo se comería el signo a medio escribir.
    React.useEffect(() => {
      if (!isSameAmount(parseMoneyInput(draft), value)) setDraft(toDisplay(value, allowNegative))
      // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo al cambiar por fuera
    }, [value])

    // Después de pintar: si se hiciera antes, React lo pisaría al re-renderizar
    // y el cursor saltaría al final en cuanto entrara un punto.
    React.useLayoutEffect(() => {
      const caret = caretRef.current
      caretRef.current = null
      if (caret !== null) inputRef.current?.setSelectionRange(caret, caret)
    })

    return (
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft}
        ref={(node) => {
          inputRef.current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        onChange={(event) => {
          const typed = event.target.value
          const kept = digitsBefore(typed, event.target.selectionStart ?? typed.length)
          const formatted = formatMoneyInput(typed, allowNegative)

          caretRef.current = caretAfterFormat(formatted, kept)
          setDraft(formatted)
          onChange(parseMoneyInput(formatted))
        }}
      />
    )
  },
)
MoneyInput.displayName = 'MoneyInput'

interface MoneyFieldProps<T extends FieldValues> extends Omit<
  MoneyInputProps,
  'value' | 'onChange' | 'name'
> {
  readonly control: Control<T>
  readonly name: FieldPath<T>
  /**
   * Si el campo se puede dejar en blanco.
   *
   * Cambia **qué se guarda al vaciarlo**: uno obligatorio guarda `NaN`, que es
   * lo que hace saltar el «escribe un monto» del esquema; uno opcional guarda
   * `undefined`, que es ausencia de dato y no un error.
   */
  readonly optional?: boolean
}

/**
 * El campo de dinero atado al formulario.
 *
 * Existe para que las ocho pantallas que piden dinero lo hagan igual. Repetir
 * el enganche en cada una es cómo acaban comportándose distinto: una agrupando
 * y otra no, una admitiendo el signo y otra comiéndoselo.
 *
 * Es controlado, y no puede no serlo: al corregir un movimiento el formulario
 * cambia la cifra desde fuera, y un campo sin control seguiría enseñando lo
 * anterior.
 */
export function MoneyField<T extends FieldValues>({
  control,
  name,
  optional = false,
  ...props
}: MoneyFieldProps<T>) {
  const { field } = useController({ control, name })

  return (
    <MoneyInput
      {...props}
      name={field.name}
      ref={field.ref}
      onBlur={field.onBlur}
      // El campo se declara numérico en el esquema; el genérico de la librería
      // no puede saberlo, y este es el único punto donde hace falta decírselo.
      value={field.value as number | null | undefined}
      onChange={(amount) => field.onChange(optional && Number.isNaN(amount) ? undefined : amount)}
    />
  )
}
