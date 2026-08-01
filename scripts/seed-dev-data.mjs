/**
 * Datos de desarrollo para la cuenta de pruebas de Nexus.
 *
 * NO es una migración ni entra en producción: siembra ~10 semanas de historia
 * verosímil para poder desarrollar y revisar pantallas que sólo tienen sentido
 * con datos acumulados (Analytics, el Plan del día, el Decision Engine).
 *
 * Dos reglas lo gobiernan:
 *
 * 1. **Coherente entre dominios.** No son seis series de ruido independientes:
 *    tras una noche corta se entrena menos o no se entrena, los días de
 *    gimnasio se come más, y el peso baja despacio con altibajos. Sin esa
 *    coherencia el motor de decisiones aprendería a razonar sobre un mundo que
 *    no existe.
 * 2. **No pisa nada.** Antes de escribir un día comprueba si ya hay registro y
 *    lo respeta. Se puede volver a ejecutar sin duplicar.
 *
 * Deja el día de hoy a medias a propósito (desayuno y algo de agua, sin
 * entrenamiento) para que el Plan del día tenga algo que recomendar.
 *
 * Uso — necesita `.env` con las credenciales de desarrollo. La RLS sigue
 * activa: entra con la sesión del usuario, no con la clave de servicio.
 *
 *     node scripts/seed-dev-data.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Días de historia que se siembran. */
const DAYS_BACK = 70

/** Días de la semana con gimnasio: lunes, martes, jueves y viernes. */
const TRAINING_WEEKDAYS = new Set([1, 2, 4, 5])

/** Por debajo de esto la noche cuenta como mala y se nota al día siguiente. */
const SHORT_NIGHT_MINUTES = 360

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

// ─── Utilidades ─────────────────────────────────────────────────────────────

const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Un día concreto a mediodía, para no depender de la hora al construirlo. */
function dayAgo(offset) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - offset)
  return d
}

/** Instante de un día a una hora dada. */
function at(day, hour, minute = 0) {
  const d = new Date(day)
  d.setHours(hour, minute, 0, 0)
  return d
}

/**
 * Aleatoriedad reproducible.
 *
 * Sembrar dos veces tiene que dar lo mismo; con `Math.random` cada ejecución
 * inventaría una historia distinta y las capturas dejarían de coincidir.
 */
let seed = 20260801
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const between = (min, max) => min + random() * (max - min)
const pick = (list) => list[Math.floor(random() * list.length)]
const chance = (probability) => random() < probability

async function insert(table, rows) {
  if (rows.length === 0) return []
  const created = []
  for (let i = 0; i < rows.length; i += 400) {
    const { data, error } = await supabase
      .from(table)
      .insert(rows.slice(i, i + 400))
      .select('id')
    if (error) throw new Error(`${table}: ${error.message}`)
    created.push(...data)
  }
  return created
}

// ─── Catálogo de alimentos ──────────────────────────────────────────────────

/**
 * Alimentos de una compra corriente en Colombia, con precio por porción en COP.
 *
 * Hacen falta para que el gasto signifique algo y para que el motor pueda
 * proponer cambios de comida dentro del presupuesto: con dos alimentos no hay
 * alternativa que ofrecer.
 */
const PANTRY = [
  ['Arroz blanco cocido', 150, 'g', 195, 4, 43, 0.4, 250],
  ['Pechuga de pollo', 150, 'g', 248, 46, 0, 5.4, 2400],
  ['Huevo', 1, 'unidad', 78, 6.3, 0.6, 5.3, 700],
  ['Frijoles cocidos', 150, 'g', 198, 12, 36, 0.8, 800],
  ['Lentejas cocidas', 150, 'g', 174, 13, 30, 0.6, 700],
  ['Arepa de maíz', 1, 'unidad', 145, 3.2, 30, 1.6, 900],
  ['Pan tajado integral', 2, 'tajadas', 160, 6, 28, 2.4, 800],
  ['Avena en hojuelas', 60, 'g', 228, 8.4, 39, 4.2, 500],
  ['Leche entera', 200, 'ml', 122, 6.4, 9.6, 6.6, 1000],
  ['Queso campesino', 50, 'g', 132, 9, 1.5, 10, 1500],
  ['Banano', 1, 'unidad', 105, 1.3, 27, 0.4, 700],
  ['Aguacate', 100, 'g', 160, 2, 8.5, 14.7, 1600],
  ['Atún en agua', 80, 'g', 92, 20, 0, 1, 4200],
  ['Plátano maduro asado', 150, 'g', 186, 2, 48, 0.5, 900],
  ['Ensalada de verduras', 120, 'g', 45, 2, 8, 0.4, 1300],
  ['Café con leche', 200, 'ml', 85, 4, 8, 3.5, 900],
]

async function ensurePantry() {
  const { data: existing, error } = await supabase
    .from('foods')
    .select(
      'id, name, calories, protein_g, carbs_g, fat_g, cost_per_serving, serving_size, serving_unit',
    )
    .eq('user_id', userId)
  if (error) throw error

  const known = new Set(existing.map(({ name }) => name))
  const rows = PANTRY.filter(([name]) => !known.has(name)).map(
    ([name, size, unit, calories, protein, carbs, fat, cop]) => ({
      user_id: userId,
      name,
      serving_size: size,
      serving_unit: unit,
      calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      cost_per_serving: cop,
      currency: 'COP',
      // `is_custom` es una columna generada: lo decide el `user_id`.
    }),
  )

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('foods').insert(rows)
    if (insertError) throw insertError
    console.log(`Alimentos: ${rows.length} nuevos con precio en COP.`)
  }

  // La tabla de arriba manda: si un precio de aquí cambió, se corrige el que ya
  // estaba. Sin esto habría que borrar el alimento a mano para arreglar una
  // cifra, y el gasto —que es el diferencial del producto— quedaría mintiendo.
  let corrected = 0
  for (const [name, , , , , , , cop] of PANTRY) {
    const food = existing.find((f) => f.name === name)
    if (!food || food.cost_per_serving === cop) continue

    const { error: updateError } = await supabase
      .from('foods')
      .update({ cost_per_serving: cop })
      .eq('id', food.id)
    if (updateError) throw updateError
    corrected += 1
  }
  if (corrected > 0) console.log(`Alimentos: ${corrected} precios corregidos.`)

  const { data: all } = await supabase
    .from('foods')
    .select('id, name, calories, cost_per_serving')
    .eq('user_id', userId)

  const byName = new Map(all.map((food) => [food.name, food]))
  return {
    desayuno: ['Avena en hojuelas', 'Huevo', 'Café con leche', 'Arepa de maíz', 'Banano']
      .map((n) => byName.get(n))
      .filter(Boolean),
    almuerzo: [
      'Arroz blanco cocido',
      'Pechuga de pollo',
      'Frijoles cocidos',
      'Lentejas cocidas',
      'Ensalada de verduras',
      'Plátano maduro asado',
      'Aguacate',
    ]
      .map((n) => byName.get(n))
      .filter(Boolean),
    cena: [
      'Atún en agua',
      'Pan tajado integral',
      'Queso campesino',
      'Ensalada de verduras',
      'Huevo',
    ]
      .map((n) => byName.get(n))
      .filter(Boolean),
    snack: ['Banano', 'Leche entera', 'Queso campesino'].map((n) => byName.get(n)).filter(Boolean),
  }
}

// ─── Hábitos y materias ─────────────────────────────────────────────────────

async function ensureHabits() {
  const { data: existing } = await supabase
    .from('habits')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .is('archived_at', null)

  const wanted = ['Estirar 10 minutos', 'Meditar 5 minutos']
  const known = new Set(existing.map(({ name }) => name))
  const missing = wanted.filter((name) => !known.has(name))

  if (missing.length > 0) {
    // Se crean con fecha antigua para que su constancia tenga historia; si
    // nacieran hoy, la ventana de cumplimiento empezaría hoy y no habría nada
    // que analizar (ver `calculateConsistency`).
    const born = at(dayAgo(DAYS_BACK), 8).toISOString()
    const { error } = await supabase.from('habits').insert(
      missing.map((name) => ({
        user_id: userId,
        name,
        frequency: 'daily',
        target_count: 1,
        icon: 'check',
        color: '#2563eb',
        created_at: born,
      })),
    )
    if (error) throw error
    console.log(`Hábitos: ${missing.length} creados.`)
  }

  const { data: all } = await supabase
    .from('habits')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .is('archived_at', null)
    .eq('is_active', true)

  return all
}

/**
 * Una rutina Push Pull Legs con sus tres días y sus ejercicios.
 *
 * Hacía falta: había decenas de entrenamientos sembrados y ninguna rutina que
 * los explicara. Además el motor no puede proponer una versión corta de algo
 * que no existe (`alternative-routine`).
 *
 * Los ejercicios van **en orden**, con los básicos delante: de ese orden
 * depende que la versión corta se quede con lo que importa.
 */
const SPLIT = [
  ['Empuje', ['Press de banca', 'Press militar', 'Flexiones', 'Extensión de tríceps', 'Plancha']],
  [
    'Tirón',
    ['Dominadas', 'Remo con barra', 'Face pull', 'Curl de bíceps', 'Curl concentrado (unilateral)'],
  ],
  ['Pierna', ['Sentadilla', 'Peso muerto', 'Zancadas', 'Hip thrust', 'Plancha']],
]

async function ensureRoutine() {
  const { data: exercises } = await supabase.from('exercises').select('id, name')
  const byName = new Map(exercises.map((e) => [e.name.toLowerCase(), e.id]))

  const { data: routines } = await supabase
    .from('routines')
    .select('id, name')
    .eq('user_id', userId)
    .is('deleted_at', null)

  let routine = routines.find((r) => r.name === 'Push Pull Legs')
  if (!routine) {
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: userId, name: 'Push Pull Legs', goal: 'hypertrophy' })
      .select('id, name')
      .single()
    if (error) throw error
    routine = data
  }

  const { data: existingDays } = await supabase
    .from('routine_days')
    .select('id, name, order_index')
    .eq('routine_id', routine.id)

  // El índice se continúa desde el último ocupado: la rutina puede traer días
  // de antes y `order_index` es único dentro de ella.
  let nextIndex = existingDays.reduce((max, d) => Math.max(max, d.order_index + 1), 0)
  const dayIds = []
  let created = 0

  for (const [dayName, exerciseNames] of SPLIT) {
    let day = existingDays.find((d) => d.name.toLowerCase() === dayName.toLowerCase())
    if (!day) {
      const { data, error } = await supabase
        .from('routine_days')
        .insert({ routine_id: routine.id, name: dayName, order_index: nextIndex })
        .select('id, name')
        .single()
      if (error) throw error
      day = data
      nextIndex += 1
      created += 1
    }
    dayIds.push(day.id)

    // Sólo se añade lo que falta: nunca se borra un ejercicio que el usuario
    // haya prescrito por su cuenta.
    const { data: prescribed } = await supabase
      .from('routine_exercises')
      .select('exercise_id, order_index')
      .eq('routine_day_id', day.id)

    const already = new Set(prescribed.map(({ exercise_id }) => exercise_id))
    let order = prescribed.reduce((max, e) => Math.max(max, e.order_index + 1), 0)

    const rows = exerciseNames
      .map((name) => byName.get(name.toLowerCase()))
      .filter((id) => id !== undefined && !already.has(id))
      .map((id) => {
        const isMain = order === 0
        const row = {
          routine_day_id: day.id,
          exercise_id: id,
          order_index: order,
          target_sets: isMain ? 4 : 3,
          target_reps: isMain ? 6 : 10,
          rest_seconds: isMain ? 180 : 90,
        }
        order += 1
        return row
      })

    if (rows.length > 0) {
      const { error } = await supabase.from('routine_exercises').insert(rows)
      if (error) throw error
    }
  }

  if (created > 0) console.log(`Rutina: ${created} días con sus ejercicios.`)

  return dayIds
}

async function ensureSubjects() {
  const { data: existing } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', userId)
    .is('deleted_at', null)

  // Objetivos alcanzables: puestos altos, el avance semanal sale siempre en
  // rojo y deja de informar. Se busca que se cumplan a ratos, no nunca.
  const wanted = [
    ['Física', 180],
    ['Programación', 240],
  ]
  const known = new Set(existing.map(({ name }) => name))
  const missing = wanted.filter(([name]) => !known.has(name))

  if (missing.length > 0) {
    const { error } = await supabase.from('subjects').insert(
      missing.map(([name, target]) => ({
        user_id: userId,
        name,
        weekly_target_minutes: target,
        color: '#2563eb',
      })),
    )
    if (error) throw error
    console.log(`Materias: ${missing.length} creadas.`)
  }

  const { data: all } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', userId)
    .is('deleted_at', null)

  return all
}

// ─── La historia ────────────────────────────────────────────────────────────

/**
 * Decide qué pasó cada día, con las dependencias entre dominios.
 *
 * Se calcula entero antes de escribir nada para que el sueño de una noche pueda
 * condicionar el entrenamiento del día siguiente.
 */
function buildStory() {
  const story = []

  for (let back = DAYS_BACK; back >= 0; back -= 1) {
    const day = dayAgo(back)
    const weekday = day.getDay()
    const isWeekend = weekday === 0 || weekday === 6
    const isToday = back === 0
    const progress = (DAYS_BACK - back) / DAYS_BACK

    // Sueño: mejora despacio a lo largo de las semanas, más los fines de semana.
    const loggedSleep = !isToday && !chance(0.1)
    const badNight = chance(0.14)
    const sleepMinutes = badNight
      ? Math.round(between(290, 355))
      : Math.round(between(390, 445) + progress * 20 + (isWeekend ? 45 : 0))

    const previous = story[story.length - 1]
    const sleptShort = previous?.sleep !== null && previous?.sleep < SHORT_NIGHT_MINUTES

    // Entrenamiento: los días que tocan, salvo que se durmiera mal —y aun así a
    // veces se va igual, sólo que menos rato.
    let trained = TRAINING_WEEKDAYS.has(weekday) && !isToday && !chance(0.12)
    let intensity = 1
    if (trained && sleptShort) {
      if (chance(0.55)) trained = false
      else intensity = 0.75
    }

    // Comida: casi siempre se registra; los días de gimnasio se come más.
    const loggedMeals = isToday || !chance(0.09)
    const extraCalories = trained ? between(180, 320) : 0

    story.push({
      back,
      day,
      isToday,
      isWeekend,
      sleep: loggedSleep ? sleepMinutes : null,
      trained,
      intensity,
      loggedMeals,
      extraCalories,
      // Se estudia más entre semana, y algo menos si se entrenó ese día. Aun
      // así se queda por debajo del objetivo semanal: es lo que ocurre de
      // verdad, y le da a la regla `study-behind` algo real que señalar.
      studied: !isToday && chance(isWeekend ? 0.4 : trained ? 0.7 : 0.85),
    })
  }

  return story
}

async function seedSleep(story) {
  const { data: existing } = await supabase.from('sleep_logs').select('date').eq('user_id', userId)
  const taken = new Set(existing.map(({ date }) => date))

  const rows = story
    .filter(({ sleep, day }) => sleep !== null && !taken.has(dateKey(day)))
    .map(({ day, sleep }) => {
      const wake = at(day, 6, Math.round(between(0, 55)))
      const bedtime = new Date(wake.getTime() - sleep * 60_000)

      return {
        user_id: userId,
        date: dateKey(day),
        bedtime: bedtime.toISOString(),
        wake_time: wake.toISOString(),
        duration_minutes: sleep,
        // La calidad no siempre se puntúa, y sigue a las horas dormidas.
        quality_rating: chance(0.2) ? null : Math.max(1, Math.min(5, Math.round(sleep / 95 - 0.2))),
      }
    })

  await insert('sleep_logs', rows)
  console.log(`Sueño: ${rows.length} noches.`)
}

async function seedWorkouts(story, routineDayIds) {
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, muscle_group')
    .limit(30)

  const byGroup = (group) => exercises.filter((e) => e.muscle_group === group)
  const split = [
    [...byGroup('chest'), ...byGroup('shoulders'), ...byGroup('triceps')],
    [...byGroup('back'), ...byGroup('biceps')],
    [...byGroup('legs'), ...byGroup('glutes')],
  ].map((group) => (group.length > 0 ? group : exercises))

  const { data: existing } = await supabase
    .from('workout_sessions')
    .select('started_at')
    .eq('user_id', userId)
  const taken = new Set(existing.map(({ started_at }) => dateKey(new Date(started_at))))

  let sessions = 0
  let sets = 0

  for (const { day, trained, intensity, back } of story) {
    if (!trained || taken.has(dateKey(day))) continue

    const started = at(day, 18, Math.round(between(0, 40)))
    const minutes = Math.round(between(52, 78) * intensity)
    const progress = (DAYS_BACK - back) / DAYS_BACK

    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        started_at: started.toISOString(),
        ended_at: new Date(started.getTime() + minutes * 60_000).toISOString(),
        status: 'completed',
        perceived_effort: Math.max(1, Math.min(10, Math.round(between(5, 9) * intensity + 1))),
        // Rotando por los días de la rutina: así el historial dice qué se
        // entrenó y el motor sabe cuál toca por rotación.
        ...(routineDayIds.length > 0
          ? { routine_day_id: routineDayIds[sessions % routineDayIds.length] }
          : {}),
      })
      .select('id')
      .single()
    if (error) throw error
    sessions += 1

    const group = split[sessions % split.length]
    const rows = []
    let setNumber = 0

    for (const exercise of group.slice(0, 4)) {
      // La carga sube poco a poco: es lo que hace que el volumen del último mes
      // supere al del anterior y la comparativa cuente algo real.
      const base = between(30, 65) + progress * 12
      const workingSets = Math.round(between(3, 4) * intensity) + 1

      for (let s = 0; s < workingSets; s += 1) {
        setNumber += 1
        const isWarmup = s === 0
        rows.push({
          session_id: session.id,
          exercise_id: exercise.id,
          set_number: setNumber,
          reps: isWarmup ? 12 : Math.round(between(6, 12)),
          weight: Math.round((isWarmup ? base * 0.55 : base) / 2.5) * 2.5,
          is_warmup: isWarmup,
          completed: !chance(0.04),
        })
      }
    }

    await insert('workout_sets', rows)
    sets += rows.length
  }

  console.log(`Entrenamiento: ${sessions} sesiones y ${sets} series.`)
}

async function seedNutrition(story, pantry) {
  const { data: existing } = await supabase
    .from('meal_logs')
    .select('logged_at')
    .eq('user_id', userId)
  const taken = new Set(existing.map(({ logged_at }) => dateKey(new Date(logged_at))))

  let meals = 0
  let items = 0
  let waters = 0

  for (const { day, isToday, loggedMeals, extraCalories, trained } of story) {
    if (!loggedMeals || taken.has(dateKey(day))) continue

    // Hoy va a medias a propósito: sólo el desayuno, para que el Plan del día
    // tenga algo pendiente que recomendar.
    // Un adulto de ~90 kg que entrena cuatro veces por semana come del orden de
    // 2.300 kcal. Con dos alimentos por comida salían 1.300 y eso no es una
    // dieta, es un dato roto: la gráfica de calorías mentiría y el motor
    // aprendería a recomendar sobre un cuerpo que no existe.
    const plan = isToday
      ? [['breakfast', 7, pantry.desayuno, 3]]
      : [
          ['breakfast', 7, pantry.desayuno, 3],
          ['lunch', 12, pantry.almuerzo, 4],
          ['dinner', 19, pantry.cena, 3],
          ...(chance(0.45) ? [['snack', 16, pantry.snack, 2]] : []),
        ]

    for (const [mealType, hour, options, count] of plan) {
      if (options.length === 0) continue

      const { data: log, error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: userId,
          meal_type: mealType,
          logged_at: at(day, hour, Math.round(between(0, 50))).toISOString(),
        })
        .select('id')
        .single()
      if (error) throw error
      meals += 1

      const chosen = new Set()
      while (chosen.size < Math.min(count, options.length)) chosen.add(pick(options))

      const rows = [...chosen].map((food) => ({
        meal_log_id: log.id,
        food_id: food.id,
        // Un día de gimnasio se sirve un poco más: es donde entran las calorías
        // de más sin inventar comidas que no ocurrieron.
        servings: Math.round((between(1.2, 2.2) + (trained ? 0.35 : 0)) * 4) / 4,
      }))

      await insert('meal_log_items', rows)
      items += rows.length
    }

    if (extraCalories > 0 && chance(0.3) && pantry.snack.length > 0) {
      const { data: log } = await supabase
        .from('meal_logs')
        .insert({
          user_id: userId,
          meal_type: 'snack',
          logged_at: at(day, 21).toISOString(),
        })
        .select('id')
        .single()
      await insert('meal_log_items', [
        { meal_log_id: log.id, food_id: pick(pantry.snack).id, servings: 1 },
      ])
      meals += 1
      items += 1
    }

    // Agua: varios registros al día, más los días de gimnasio.
    const target = between(1500, 2400) + (trained ? 400 : 0)
    const logs = isToday ? 2 : Math.round(between(4, 7))
    const rows = []
    for (let i = 0; i < logs; i += 1) {
      rows.push({
        user_id: userId,
        amount_ml: Math.round(target / logs / 50) * 50,
        logged_at: at(day, 8 + i * 2, Math.round(between(0, 55))).toISOString(),
      })
    }
    await insert('water_logs', rows)
    waters += rows.length
  }

  console.log(`Nutrición: ${meals} comidas, ${items} alimentos y ${waters} registros de agua.`)
}

async function seedStudy(story, subjects) {
  if (subjects.length === 0) return

  const { data: existing } = await supabase
    .from('study_sessions')
    .select('started_at')
    .eq('user_id', userId)
  const taken = new Set(existing.map(({ started_at }) => dateKey(new Date(started_at))))

  const rows = []
  for (const { day, studied } of story) {
    if (!studied || taken.has(dateKey(day))) continue

    const sessions = chance(0.45) ? 2 : 1
    for (let i = 0; i < sessions; i += 1) {
      const started = at(day, 15 + i * 4, Math.round(between(0, 50)))
      const minutes = Math.round(between(45, 130))

      rows.push({
        user_id: userId,
        subject_id: pick(subjects).id,
        started_at: started.toISOString(),
        ended_at: new Date(started.getTime() + minutes * 60_000).toISOString(),
        duration_minutes: minutes,
        focus_rating: chance(0.25) ? null : Math.round(between(3, 5)),
      })
    }
  }

  await insert('study_sessions', rows)
  console.log(`Estudio: ${rows.length} sesiones.`)
}

/**
 * Valor estable en [0,1) para un par (hábito, día).
 *
 * Depende sólo de sus argumentos, así que la misma pareja da siempre lo mismo
 * por muchas veces que se ejecute el sembrado.
 */
function dailyRoll(habitId, key) {
  const text = `${habitId}|${key}`
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return ((hash >>> 0) % 10000) / 10000
}

async function seedHabits(story, habits) {
  if (habits.length === 0) return

  const { data: existing } = await supabase
    .from('habit_logs')
    .select('habit_id, date')
    .eq('user_id', userId)
  const taken = new Set(existing.map(({ habit_id, date }) => `${habit_id}|${date}`))

  // Cada hábito cuesta lo suyo: leer se sostiene mejor que meditar.
  const stickiness = new Map(habits.map((habit, index) => [habit.id, 0.78 - index * 0.11]))

  const rows = []
  for (const { day, isToday, isWeekend } of story) {
    const key = dateKey(day)

    for (const habit of habits) {
      if (taken.has(`${habit.id}|${key}`)) continue
      if (key < dateKey(new Date(habit.created_at))) continue
      // Hoy se deja sin marcar: el Plan del día debe poder recordarlo.
      if (isToday) continue

      const rate = (stickiness.get(habit.id) ?? 0.6) - (isWeekend ? 0.15 : 0)
      // Determinista por (hábito, día), no un dado nuevo en cada ejecución: si
      // no, cada pasada marca algunos de los días que quedaron sin marcar y la
      // constancia trepa sola hacia el 100 % a base de re-ejecutar.
      if (dailyRoll(habit.id, key) >= rate) continue

      rows.push({
        user_id: userId,
        habit_id: habit.id,
        date: key,
        completed: true,
        count: 1,
      })
    }
  }

  await insert('habit_logs', rows)
  console.log(`Hábitos: ${rows.length} días marcados.`)
}

async function seedWeight(story) {
  const { data: existing } = await supabase
    .from('body_metrics')
    .select('measured_at, value')
    .eq('user_id', userId)
    .eq('metric_type', 'weight')
    .order('measured_at', { ascending: false })

  const taken = new Set(existing.map(({ measured_at }) => dateKey(new Date(measured_at))))

  // Termina donde está el peso real registrado, para no contradecirlo: la
  // historia explica cómo se llegó hasta ahí, no lo reescribe.
  const current = existing[0]?.value ?? 90
  const start = current + 3.2

  const rows = []
  for (const { day, back } of story) {
    // Se pesa cada 4-6 días, en ayunas.
    if (back % 5 !== 0 || back === 0 || taken.has(dateKey(day))) continue

    const progress = (DAYS_BACK - back) / DAYS_BACK
    const value = start - (start - current) * progress + between(-0.5, 0.5)

    rows.push({
      user_id: userId,
      metric_type: 'weight',
      value: Math.round(value * 10) / 10,
      unit: 'kg',
      measured_at: at(day, 6, 30).toISOString(),
    })
  }

  await insert('body_metrics', rows)
  console.log(`Salud: ${rows.length} pesajes.`)
}

// ─── Ejecución ──────────────────────────────────────────────────────────────

console.log('Sesión iniciada (la RLS sigue activa).\n')

const pantry = await ensurePantry()
const routineDayIds = await ensureRoutine()
const habits = await ensureHabits()
const subjects = await ensureSubjects()
const story = buildStory()

await seedSleep(story)
await seedWorkouts(story, routineDayIds)
await seedNutrition(story, pantry)
await seedStudy(story, subjects)
await seedHabits(story, habits)
await seedWeight(story)

console.log('\nListo. Hoy queda a medias a propósito, para que el Plan tenga qué decir.')
