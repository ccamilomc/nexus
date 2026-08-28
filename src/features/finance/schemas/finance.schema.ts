import { z } from 'zod'

/**
 * Un movimiento, tal como lo escribe el usuario.
 *
 * El importe se pide **entero**: el peso colombiano no tiene centavos en
 * circulación, así que admitir decimales sólo daría ocasión de equivocarse.
 */
export const transactionSchema = z
  .object({
    kind: z.enum(['income', 'expense', 'transfer']),
    amount: z
      .number({ message: 'Escribe un monto.' })
      .int('Los pesos no llevan centavos.')
      .positive('El monto tiene que ser mayor que cero.')
      // Diez mil millones: mucho más que cualquier gasto personal, y por debajo
      // de lo que aguanta la columna. Atrapa el cero de más al teclear.
      .max(9_999_999_999, 'Ese monto no parece real. Revísalo.'),
    accountId: z.string().min(1, 'Elige una cuenta.'),
    /** A dónde va el dinero. Sólo en un traspaso. */
    toAccountId: z.string().nullable(),
    // Sin categoría también es válido: obligar a clasificar en el momento haría
    // que registrar costara más, y lo que no se registra no existe.
    categoryId: z.string().nullable(),
    /** La deuda que abona este movimiento, si abona alguna. */
    debtId: z.string().nullable(),
    occurredOn: z.string().min(1, 'Elige una fecha.'),
    note: z.string().trim().max(200, 'La nota es demasiado larga.').optional(),
    /**
     * Las partes que se van a otras categorías.
     *
     * **Se recortan del total; no lo sustituyen.** Lo que no se reparta se
     * queda en `categoryId`, así que el resto no hay que teclearlo y no puede
     * quedar descuadrado.
     */
    splits: z.array(
      z.object({
        categoryId: z.string().min(1, 'Elige una categoría.'),
        amount: z
          .number({ message: 'Escribe cuánto.' })
          .int('Los pesos no llevan centavos.')
          .positive('Tiene que ser mayor que cero.'),
      }),
    ),
  })
  // La misma forma que exige la base, dicha aquí para que el error salga en el
  // campo y no como un fallo del servidor.
  .refine((values) => values.kind !== 'transfer' || values.toAccountId !== null, {
    message: 'Elige a qué cuenta va.',
    path: ['toAccountId'],
  })
  .refine((values) => values.kind !== 'transfer' || values.toAccountId !== values.accountId, {
    message: 'Tiene que ser una cuenta distinta.',
    path: ['toAccountId'],
  })
  // Un traspaso no se gasta en nada: cambia de cajón. La base lo rechaza
  // también; aquí se dice antes de intentarlo.
  .refine((values) => values.kind !== 'transfer' || values.splits.length === 0, {
    message: 'Un traspaso no se reparte entre categorías.',
    path: ['splits'],
  })
  // El total manda sobre las partes, siempre. Con `amount` sin escribir todavía
  // es `NaN`, y compararlo diría que no cabe nada: el aviso saldría antes de
  // que hubiera nada mal.
  .refine(
    (values) =>
      Number.isNaN(values.amount) ||
      values.splits.reduce((sum, split) => sum + split.amount, 0) <= values.amount,
    { message: 'Lo repartido no cabe en el total.', path: ['splits'] },
  )
  // Dos partes de la misma categoría son dos formas de decir lo mismo, y el
  // índice único de la base las rechaza.
  .refine(
    (values) =>
      new Set(values.splits.map((split) => split.categoryId)).size === values.splits.length,
    { message: 'Esa categoría ya está repartida.', path: ['splits'] },
  )
  // Recortar parte de una categoría para dársela a ella misma no significa nada.
  .refine((values) => values.splits.every((split) => split.categoryId !== values.categoryId), {
    message: 'Esa ya es la categoría del movimiento.',
    path: ['splits'],
  })

export type TransactionValues = z.infer<typeof transactionSchema>

/** Una cuenta: un cajón con nombre, no una cuenta conectada a ningún banco. */
export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre.').max(40, 'El nombre es demasiado largo.'),
  kind: z.enum(['cash', 'bank', 'wallet', 'credit_card', 'savings']),
  initialBalance: z
    .number({ message: 'Escribe cuánto hay.' })
    .int('Los pesos no llevan centavos.')
    // Puede ser negativo: una tarjeta de crédito empieza debiendo.
    .min(-9_999_999_999)
    .max(9_999_999_999),
})

export type AccountValues = z.infer<typeof accountSchema>

/** Una categoría propia, para lo que el catálogo no cubre. */
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre.').max(30, 'El nombre es demasiado largo.'),
  kind: z.enum(['income', 'expense']),
})

export type CategoryValues = z.infer<typeof categorySchema>

/**
 * Una deuda.
 *
 * La tasa es **mensual** y se pide sólo cuando corre interés: pedirla siempre
 * invitaría a poner un número donde no hace falta, y la base rechaza una tasa
 * sin forma de correr.
 */
export const debtSchema = z
  .object({
    counterpart: z
      .string()
      .trim()
      .min(1, 'Escribe a quién.')
      .max(60, 'El nombre es demasiado largo.'),
    direction: z.enum(['i_owe', 'owed_to_me']),
    principal: z
      .number({ message: 'Escribe cuánto.' })
      .int('Los pesos no llevan centavos.')
      .positive('Tiene que ser mayor que cero.')
      .max(9_999_999_999, 'Ese monto no parece real. Revísalo.'),
    interestKind: z.enum(['none', 'monthly_on_principal', 'monthly_on_balance']),
    interestRate: z
      .number()
      .min(0, 'No puede ser negativa.')
      .max(100, 'Más del 100 % mensual no es una tasa, es un error.')
      .nullable(),
    startedOn: z.string().min(1, 'Elige desde cuándo.'),
    dueOn: z.string().nullable(),
    instalments: z.number().int().positive('Tiene que ser al menos una.').nullable(),
    note: z.string().trim().max(200, 'La nota es demasiado larga.').optional(),
  })
  .refine((values) => values.interestKind === 'none' || values.interestRate !== null, {
    message: 'Escribe la tasa mensual.',
    path: ['interestRate'],
  })

export type DebtValues = z.infer<typeof debtSchema>

/** Un pago fijo: el gimnasio, el arriendo, una suscripción. */
export const recurringSchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre.').max(40, 'El nombre es demasiado largo.'),
  kind: z.enum(['income', 'expense']),
  amount: z
    .number({ message: 'Escribe cuánto.' })
    .int('Los pesos no llevan centavos.')
    .positive('Tiene que ser mayor que cero.')
    .max(9_999_999_999, 'Ese monto no parece real. Revísalo.'),
  accountId: z.string().min(1, 'Elige una cuenta.'),
  categoryId: z.string().nullable(),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  nextDueOn: z.string().min(1, 'Elige cuándo toca el siguiente.'),
  note: z.string().trim().max(200, 'La nota es demasiado larga.').optional(),
})

export type RecurringValues = z.infer<typeof recurringSchema>
