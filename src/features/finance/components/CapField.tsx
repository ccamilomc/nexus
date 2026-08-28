import { Check, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface CapFieldProps {
  /** Qué límite se está poniendo. Va al lector de pantalla. */
  readonly label: string
  /** El límite puesto, o `null` cuando no hay ninguno. */
  readonly current: number | null
  /** Lo que dice el botón cuando todavía no hay límite. */
  readonly setLabel: string
  readonly isBusy: boolean
  /** El fallo de la última operación, para no dejarlo sólo en la consola. */
  readonly failure: string | null
  readonly onSave: (amount: number) => Promise<unknown>
  /** Quitarlo. `null` cuando no hay nada que quitar. */
  readonly onRemove: (() => Promise<unknown>) | null
}

/**
 * Poner, cambiar o quitar un límite en pesos, sin salir de donde se lee.
 *
 * La usan el tope de una categoría y el presupuesto del mes. **Son la misma
 * interacción**, y tenerla escrita dos veces era cómo acababan comportándose
 * distinto: una validando el cero y la otra no, una avisando del fallo y la
 * otra callándoselo.
 *
 * **Se guarda con un botón y no al salir del campo.** Escribir «40» camino de
 * «400.000» y que se guarde solo sería peor que teclear de más.
 */
export function CapField({
  label,
  current,
  setLabel,
  isBusy,
  failure,
  onSave,
  onRemove,
}: CapFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (!isEditing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-muted-foreground"
        onClick={() => {
          setDraft(current === null ? '' : String(current))
          setIsEditing(true)
        }}
      >
        {current === null ? setLabel : 'Cambiar'}
      </Button>
    )
  }

  const amount = Number(draft)
  const canSave = draft !== '' && Number.isFinite(amount) && amount > 0

  // El fallo lo cuenta quien dispara la operación, así que aquí sólo hace falta
  // no cerrar la edición: cerrarla dejaría el aviso apuntando a nada.
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action()
      setIsEditing(false)
    } catch {
      /* El mensaje ya viene por `failure`. */
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      <Input
        type="number"
        inputMode="numeric"
        step={1}
        min={1}
        value={draft}
        autoFocus
        aria-label={label}
        className="h-9 w-32"
        onChange={(event) => setDraft(event.target.value)}
      />

      <Button
        type="button"
        size="icon"
        disabled={!canSave || isBusy}
        aria-label={`Guardar ${label.toLowerCase()}`}
        onClick={() => void run(() => onSave(amount))}
      >
        <Check aria-hidden />
      </Button>

      {/* Quitar sólo aparece si hay algo puesto: no se puede quitar lo que no
          está, y el botón sobraría en la mayoría de las filas. */}
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isBusy}
          className="text-muted-foreground"
          onClick={() => void run(onRemove)}
        >
          Quitar
        </Button>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Cancelar"
        className="text-muted-foreground"
        onClick={() => setIsEditing(false)}
      >
        <X aria-hidden />
      </Button>

      {/* Sin esto, un fallo al guardar sólo salía por consola y la fila se
          quedaba en modo edición sin decir por qué. Pasó de verdad. */}
      {failure ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {failure}
        </p>
      ) : null}
    </div>
  )
}
