import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormAlert, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'

import { FinanceNav } from '../components/FinanceNav'
import { useArchiveCategory, useCategories, useCreateCategory } from '../hooks/use-finance'
import { categorySchema, type CategoryValues } from '../schemas/finance.schema'
import type { FinanceCategory } from '../types/finance.types'

/** Las categorías: las que trae Nexus y las tuyas. */
export function CategoriesPage() {
  const categories = useCategories()
  const create = useCreateCategory()
  const archive = useArchiveCategory()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { kind: 'expense' },
  })

  const onSubmit = handleSubmit((values) => {
    create.mutate(values, { onSuccess: () => reset({ kind: values.kind, name: '' }) })
  })

  const expenses = (categories.data ?? []).filter((category) => category.kind === 'expense')
  const incomes = (categories.data ?? []).filter((category) => category.kind === 'income')

  return (
    <>
      <PageHeader title="Categorías" description="En qué agrupas lo que gastas y lo que recibes." />
      <FinanceNav />

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-medium">Crear una categoría</h2>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category-name">Nombre</Label>
                  <Input id="category-name" placeholder="Mascota, Regalos…" {...register('name')} />
                  {errors.name ? <FormAlert>{errors.name.message}</FormAlert> : null}
                </div>

                <div>
                  <Label htmlFor="category-kind">¿De qué?</Label>
                  <Select id="category-kind" {...register('kind')}>
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting || create.isPending}>
                <Plus aria-hidden />
                {create.isPending ? 'Creando…' : 'Crear'}
              </Button>

              {create.error ? <FormAlert>{create.error.message}</FormAlert> : null}
            </form>
          </CardContent>
        </Card>

        {categories.isPending ? (
          <SkeletonList label="Cargando tus categorías" rows={3} rowClassName="h-12" />
        ) : categories.isError ? (
          <LoadFailure
            message={categories.error.message}
            onRetry={() => void categories.refetch()}
          />
        ) : (
          <>
            <CategoryGroup
              title="Gastos"
              categories={expenses}
              isArchiving={archive.isPending}
              onArchive={(id) => archive.mutate(id)}
            />
            <CategoryGroup
              title="Ingresos"
              categories={incomes}
              isArchiving={archive.isPending}
              onArchive={(id) => archive.mutate(id)}
            />
          </>
        )}
      </div>
    </>
  )
}

interface CategoryGroupProps {
  readonly title: string
  readonly categories: readonly FinanceCategory[]
  readonly isArchiving: boolean
  readonly onArchive: (categoryId: string) => void
}

function CategoryGroup({ title, categories, isArchiving, onArchive }: CategoryGroupProps) {
  if (categories.length === 0) return null

  return (
    <Card>
      <CardContent className="p-2">
        <h2 className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <ul className="divide-y divide-border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>

              {/* Las del catálogo (sin `user_id`) son de todos: no se archivan,
                  y la RLS lo impediría igualmente. Sólo se retiran las propias. */}
              {category.user_id === null ? (
                <span className="shrink-0 text-xs text-muted-foreground">De Nexus</span>
              ) : (
                <ConfirmButton
                  label="Archivar"
                  confirmLabel="Sí, archivar"
                  disabled={isArchiving}
                  onConfirm={() => onArchive(category.id)}
                  className="shrink-0 text-muted-foreground"
                />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
