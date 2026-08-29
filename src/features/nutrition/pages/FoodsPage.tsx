import { Plus, ScanBarcode, UtensilsCrossed } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { EmptyState, FormAlert, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { matchesQuery } from '@/shared/utils'

import { BarcodePhotoScanner } from '../components/BarcodePhotoScanner'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { CatalogSuggestions } from '../components/CatalogSuggestions'
import { FoodForm } from '../components/FoodForm'
import { FoodList } from '../components/FoodList'
import { useBarcodeLookup } from '../hooks/use-barcode-lookup'
import { useDeleteFood, useFoods } from '../hooks/use-nutrition'
import type { CreateFoodValues } from '../schemas/nutrition.schema'
import type { Food } from '../types/nutrition.types'
import { scanMode } from '../utils/barcode-detector'
import { type LocalFood, toScannedFood } from '../utils/local-catalog'
import type { ScanResult } from '../utils/scanned-food'

/** Un formulario ya relleno con lo que salió del escaneo, y de dónde salió. */
interface Escaneado {
  readonly values: CreateFoodValues
  readonly note: string
}

/** Lo mínimo para empezar un alimento a mano: 100 g y las cifras en cero. */
const VACIO = {
  servingSize: 100,
  servingUnit: 'g',
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
} as const

/**
 * Qué enseñar según lo que devolvió el escaneo.
 *
 * **Los tres desenlaces se cuentan distinto.** Que el producto exista sin cifras
 * no es lo mismo que no existir: en el primero ya está el nombre puesto, y
 * decir «no se encontró» sería mentir y hacer teclearlo otra vez.
 */
function describirEscaneo(result: ScanResult): Escaneado {
  if (result.kind === 'listo') {
    const { food } = result
    return {
      values: {
        name: food.name,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        ...(food.brand ? { brand: food.brand } : {}),
      },
      note: 'Lo trajimos de Open Food Facts, una base abierta que llena la gente. Las cifras van por 100 g: compáralas con el paquete antes de guardar.',
    }
  }

  if (result.kind === 'sin-macros') {
    return {
      values: {
        ...VACIO,
        name: result.name,
        ...(result.brand ? { brand: result.brand } : {}),
      },
      note: `Encontramos «${result.name}», pero sin sus cifras. Cópialas del paquete: el nombre ya está puesto.`,
    }
  }

  return {
    values: { ...VACIO, name: '' },
    note: 'Ese código no está en Open Food Facts. Escríbelo y queda en tu catálogo para siempre.',
  }
}

/** Catálogo de alimentos y gestión de los propios. */
export function FoodsPage() {
  const { data, isPending, isError, error, refetch } = useFoods()
  const deleteFood = useDeleteFood()
  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<Food | null>(null)
  /** Del que se copia para crear uno propio; no se edita. */
  const [copying, setCopying] = useState<Food | null>(null)
  const [savedName, setSavedName] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  // Se decide una vez: lo que sabe hacer el navegador no cambia a mitad de
  // sesión, y volver a preguntarlo en cada pintado sería trabajo por nada.
  const modo = useMemo(() => scanMode(), [])
  const [scanned, setScanned] = useState<Escaneado | null>(null)
  const lookup = useBarcodeLookup()
  const { mutate: buscarCodigo } = lookup

  /**
   * Estable a propósito: el escáner la tiene como dependencia de su efecto, y
   * una función nueva en cada render apagaría y encendería la cámara sin parar.
   */
  const onDetected = useCallback(
    (barcode: string) => {
      setIsScanning(false)
      buscarCodigo(barcode, {
        onSuccess: (result) => {
          setScanned(describirEscaneo(result))
        },
      })
    },
    [buscarCodigo],
  )

  /** Del catálogo al formulario, por el mismo camino que un escaneo. */
  const onPickFromCatalog = (food: LocalFood) => {
    setScanned(describirEscaneo({ kind: 'listo', food: toScannedFood(food) }))
  }

  if (isPending) return <SkeletonList label="Cargando alimentos" rows={6} rowClassName="h-16" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  const isFormOpen = isCreating || editing !== null || copying !== null || scanned !== null
  const isBusy = isFormOpen || isScanning || lookup.isPending
  const visible = data.filter((food) => matchesQuery(food.name, query))

  /** Todo lo que abre el formulario cierra los otros modos y limpia los avisos. */
  const closeOthers = () => {
    setIsCreating(false)
    setEditing(null)
    setCopying(null)
    setSavedName(null)
    setScanned(null)
    setIsScanning(false)
    lookup.reset()
    deleteFood.reset()
  }

  const openCreate = () => {
    closeOthers()
    setIsCreating(true)
  }

  const openEdit = (food: Food) => {
    closeOthers()
    setEditing(food)
  }

  const openCopy = (food: Food) => {
    closeOthers()
    setCopying(food)
  }

  const onSaved = (food: Food) => {
    setIsCreating(false)
    setEditing(null)
    setCopying(null)
    setScanned(null)
    setSavedName(food.name)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'alimento' : 'alimentos'}
        </p>
        {isBusy ? null : (
          <div className="flex items-center gap-1.5">
            {/* Ahora se ofrece siempre. Donde hay lector nativo lee la cámara
                sola; donde no —el iPhone—, se toma una foto. Antes el botón no
                aparecía en el iPhone, y era la mitad de los teléfonos de casa. */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                closeOthers()
                setIsScanning(true)
              }}
            >
              <ScanBarcode aria-hidden />
              Escanear
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus aria-hidden />
              Crear alimento
            </Button>
          </div>
        )}
      </div>

      {isScanning ? (
        modo === 'live' ? (
          <BarcodeScanner
            onDetected={onDetected}
            onCancel={() => {
              setIsScanning(false)
            }}
          />
        ) : (
          <BarcodePhotoScanner
            onDetected={onDetected}
            onCancel={() => {
              setIsScanning(false)
            }}
          />
        )
      ) : null}

      {lookup.isPending ? (
        <p className="text-sm text-muted-foreground">Buscando el producto…</p>
      ) : null}

      {lookup.isError ? <FormAlert>{lookup.error.message}</FormAlert> : null}

      {savedName ? (
        <FormAlert variant="success">Guardamos «{savedName}» en tu catálogo.</FormAlert>
      ) : null}

      {deleteFood.isError ? <FormAlert>{deleteFood.error.message}</FormAlert> : null}

      {editing ? (
        <FoodForm food={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />
      ) : copying ? (
        <FoodForm template={copying} onSaved={onSaved} onCancel={() => setCopying(null)} />
      ) : scanned ? (
        <FoodForm
          prefill={scanned.values}
          prefillNote={scanned.note}
          onSaved={onSaved}
          onCancel={() => setScanned(null)}
        />
      ) : isCreating ? (
        <FoodForm onSaved={onSaved} onCancel={() => setIsCreating(false)} />
      ) : null}

      {isBusy ? null : (
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar alimento"
          aria-label="Buscar alimento"
        />
      )}

      {visible.length === 0 ? (
        isBusy ? null : (
          <EmptyState
            icon={UtensilsCrossed}
            title={query ? 'Ningún alimento coincide' : 'Aún no hay alimentos'}
            description={
              query
                ? 'Prueba con otro nombre o crea el alimento.'
                : 'Crea tu primer alimento para empezar tu catálogo.'
            }
          />
        )
      ) : (
        <FoodList
          foods={visible}
          onEdit={openEdit}
          onCopy={openCopy}
          onDelete={(food) => {
            setSavedName(null)
            deleteFood.mutate(food.id)
          }}
        />
      )}

      {/* Debajo de lo tuyo, nunca encima: lo que buscabas son tus alimentos, y
          esto es una ayuda para no teclear siete cifras. */}
      {isBusy ? null : <CatalogSuggestions query={query} onPick={onPickFromCatalog} />}
    </div>
  )
}
