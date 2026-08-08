/**
 * Datos de finanzas para la cuenta de pruebas de Nexus.
 *
 * NO es una migración ni entra en producción. Siembra un mes verosímil —sueldo,
 * gastos repartidos por días, un fijo ya pagado y dos por vencer— para poder
 * revisar pantallas que sólo dicen algo con movimiento acumulado: los totales,
 * los topes y la proyección de cierre de mes.
 *
 * **No pisa nada.** Antes de escribir comprueba si ya existe y lo respeta, así
 * que se puede volver a ejecutar sin duplicar.
 *
 * Uso — necesita `.env` con las credenciales de desarrollo. La RLS sigue activa:
 * entra con la sesión del usuario, no con la clave de servicio.
 *
 *     node scripts/seed-finance-dev.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ─── Entorno y sesión ───────────────────────────────────────────────────────

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=')
      return [line.slice(0, at), line.slice(at + 1).replace(/^["']|["']$/g, '')]
    }),
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: env.VITE_DEV_USER_EMAIL,
  password: env.VITE_DEV_USER_PASSWORD,
})
if (authError) throw authError
const userId = auth.user.id

// ─── Catálogo ───────────────────────────────────────────────────────────────

const today = new Date()
const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
const day = (n) => `${monthPrefix}-${String(n).padStart(2, '0')}`

const { data: accounts, error: accountsError } = await supabase
  .from('finance_accounts')
  .select('id, name')
  .eq('user_id', userId)
  .is('archived_at', null)
if (accountsError) throw accountsError

const account = accounts[0]
if (!account) throw new Error('No hay ninguna cuenta: crea una desde la app antes de sembrar.')

const { data: categories, error: categoriesError } = await supabase
  .from('finance_categories')
  .select('id, name, kind')
if (categoriesError) throw categoriesError

const categoryId = (name) => categories.find((category) => category.name === name)?.id ?? null

// ─── Pagos fijos ────────────────────────────────────────────────────────────

/** Crea un fijo si no lo hay ya con ese nombre, y devuelve su id. */
async function ensureRecurring({ name, amount, dueOn, category, kind = 'expense' }) {
  const { data: existing, error: findError } = await supabase
    .from('finance_recurring')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .is('deleted_at', null)
    .maybeSingle()
  if (findError) throw findError
  if (existing) return existing.id

  const [, , anchor] = dueOn.split('-').map(Number)
  const { data, error } = await supabase
    .from('finance_recurring')
    .insert({
      user_id: userId,
      account_id: account.id,
      category_id: categoryId(category),
      name,
      amount,
      kind,
      frequency: 'monthly',
      next_due_on: dueOn,
      anchor_day: anchor,
    })
    .select('id')
    .single()
  if (error) throw error

  return data.id
}

// Vencido y sin confirmar: deja algo que pagar de un toque en la pestaña Fijos,
// y comprueba que un fijo atrasado dentro del mes sigue contando como pendiente.
await ensureRecurring({ name: 'Gimnasio', amount: 150_000, dueOn: day(3), category: 'Gimnasio' })
// Por vencer: son los que la proyección tiene que restar.
await ensureRecurring({ name: 'Arriendo', amount: 1_200_000, dueOn: day(30), category: 'Arriendo' })
await ensureRecurring({ name: 'Internet', amount: 120_000, dueOn: day(15), category: 'Servicios' })

// ─── Movimientos ────────────────────────────────────────────────────────────

const movements = [
  { kind: 'income', amount: 3_500_000, on: day(1), category: 'Salario', note: 'Sueldo' },
  { kind: 'expense', amount: 180_000, on: day(1), category: 'Mercado', note: 'Mercado semanal' },
  { kind: 'expense', amount: 45_000, on: day(3), category: 'Restaurantes', note: 'Almuerzo fuera' },
  { kind: 'expense', amount: 30_000, on: day(5), category: 'Transporte', note: 'Taxi' },
  { kind: 'expense', amount: 60_000, on: day(6), category: 'Ocio', note: 'Cine' },
  { kind: 'expense', amount: 95_000, on: day(7), category: 'Mercado', note: 'Frutas y verduras' },
]

let created = 0
for (const movement of movements) {
  const { data: existing, error: findError } = await supabase
    .from('finance_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('occurred_on', movement.on)
    .eq('amount', movement.amount)
    .is('deleted_at', null)
    .maybeSingle()
  if (findError) throw findError
  if (existing) continue

  const { error } = await supabase.from('finance_transactions').insert({
    user_id: userId,
    account_id: account.id,
    category_id: categoryId(movement.category),
    kind: movement.kind,
    amount: movement.amount,
    occurred_on: movement.on,
    note: movement.note,
  })
  if (error) throw error
  created += 1
}

console.log(`Listo. Movimientos nuevos: ${created}. Cuenta usada: ${account.name}.`)
