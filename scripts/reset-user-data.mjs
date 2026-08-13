/**
 * Deja la cuenta como recién estrenada, sin borrarla.
 *
 * Existe para un momento concreto: el día que los datos de prueba dejen de hacer
 * falta y empiece el uso de verdad. Borrarlos a mano, tabla por tabla, es
 * exactamente donde se cuela un error —hay seis dependencias que sólo dejan
 * borrar en un orden—, así que el orden se escribe una vez y se prueba.
 *
 * **Por defecto no borra nada.** Sin `--borrar` sólo cuenta lo que hay y enseña
 * lo que se iría. Es una operación que no se deshace: tiene que costar dos
 * intentos.
 *
 * **Entra con la sesión del usuario, no con la clave de servicio.** Eso lo hace
 * más lento y es a propósito: con la RLS activa, un fallo en este archivo no
 * puede tocar los datos de otra cuenta aunque se equivoque de filtro. La
 * seguridad no depende de que el script esté bien escrito.
 *
 * Qué **no** toca:
 *
 * - La cuenta ni su perfil. Se sigue entrando igual, y la altura se corrige
 *   desde salud en dos toques si hace falta.
 * - Los catálogos del sistema —los alimentos, ejercicios y categorías que vienen
 *   con Nexus—, que no son de nadie. La RLS tampoco lo permitiría.
 *
 * Uso — necesita `.env` con las credenciales de desarrollo.
 *
 *     node scripts/reset-user-data.mjs            # dice qué se iría
 *     node scripts/reset-user-data.mjs --borrar   # lo borra
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * En qué orden se vacía, y no es alfabético.
 *
 * Seis claves foráneas son `restrict` y **bloquean** el borrado si se hace al
 * revés: las comidas y los planes sujetan a los alimentos, las rutinas y los
 * entrenamientos sujetan a los ejercicios, y los movimientos y los fijos sujetan
 * a las cuentas. Por eso la actividad va primero y los catálogos después.
 *
 * Lo que cuelga de estas tablas —las series de un entrenamiento, los alimentos
 * de una comida, los días de una rutina— no aparece aquí: se va en cascada.
 */
const ORDER = [
  // Sujetan catálogos: tienen que irse antes que ellos.
  ['meal_logs', 'comidas'],
  ['meal_plans', 'planes de comida'],
  ['workout_sessions', 'entrenamientos'],
  ['routines', 'rutinas'],
  ['finance_transactions', 'movimientos'],
  ['finance_recurring', 'pagos fijos'],

  // Actividad suelta.
  ['water_logs', 'registros de agua'],
  ['sleep_logs', 'noches'],
  ['habit_logs', 'hábitos marcados'],
  ['habits', 'hábitos'],
  ['study_sessions', 'sesiones de estudio'],
  ['body_metrics', 'mediciones'],
  ['daily_plans', 'planes del día'],
  ['recommendations', 'recomendaciones descartadas'],
  ['assistant_conversations', 'conversaciones'],
  ['finance_budgets', 'topes'],
  ['finance_debts', 'deudas'],
  ['progress_photos', 'fotos de progreso'],

  // Objetivos y preferencias.
  ['nutrition_goals', 'objetivos de nutrición'],
  ['sleep_goals', 'objetivos de sueño'],
  ['health_goals', 'objetivos de salud'],
  ['user_preferences', 'preferencias'],
  ['notifications', 'avisos'],

  // Catálogos propios, ya sin nada que los sujete.
  ['subjects', 'materias'],
  ['foods', 'alimentos propios'],
  ['exercises', 'ejercicios propios'],
  ['finance_accounts', 'cuentas'],
  ['finance_categories', 'categorías propias'],
]

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

// ─── Recuento ───────────────────────────────────────────────────────────────

const willDelete = process.argv.includes('--borrar')

console.log(`Cuenta: ${auth.user.email}`)
console.log(willDelete ? 'Modo: BORRAR\n' : 'Modo: sólo mirar (usa --borrar para hacerlo)\n')

let total = 0
const present = []

for (const [table, label] of ORDER) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw new Error(`${table}: ${error.message}`)

  if (count > 0) {
    present.push([table, label, count])
    total += count
  }
}

if (total === 0) {
  console.log('No hay nada que borrar: la cuenta ya está vacía.')
  process.exit(0)
}

for (const [, label, count] of present) {
  console.log(`  ${String(count).padStart(5)}  ${label}`)
}
console.log(`\n  ${String(total).padStart(5)}  en total (más lo que se va en cascada)`)

if (!willDelete) {
  console.log('\nNo se ha borrado nada. Para hacerlo:')
  console.log('  node scripts/reset-user-data.mjs --borrar')
  process.exit(0)
}

// ─── Borrado ────────────────────────────────────────────────────────────────

console.log('\nBorrando...\n')

for (const [table, label] of ORDER) {
  const { error } = await supabase.from(table).delete().eq('user_id', userId)
  // El orden está pensado para que esto no pase, pero si una tabla nueva trae
  // una dependencia sin contemplar, hay que verlo y no seguir como si nada.
  if (error) throw new Error(`No se pudo vaciar ${label} (${table}): ${error.message}`)
}

let left = 0
for (const [table] of ORDER) {
  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  left += count ?? 0
}

console.log(
  left === 0
    ? 'Listo. La cuenta está vacía y la sesión sigue siendo la misma.'
    : `Quedan ${left} filas sin borrar. Revisa el orden de ORDER.`,
)
