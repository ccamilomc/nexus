/**
 * Busca en FoodData Central (USDA, dominio público) los frescos que faltan.
 *
 * Sonda de una vez para poder revisar a mano lo que trae antes de escribir nada.
 */
// **La clave de demostracion admite 30 peticiones por hora.** Con veintidos
// alimentos se llega justo, y si sale un 429 el script para y guarda lo que
// lleve: se vuelve a ejecutar mas tarde y se completa.
const BASE = 'https://api.nal.usda.gov/fdc/v1/foods/search'

// Lo que se come aquí y Nexus no tiene. El nombre en español es el que se
// guardará; el de la izquierda es con el que hay que buscar en USDA.
const QUIERO = [
  ['plantains, green, raw', 'Plátano verde'],
  ['plantains, yellow, raw', 'Plátano maduro'],
  ['cassava, raw', 'Yuca cruda'],
  ['yam, raw', 'Ñame crudo'],
  // 'sweet potato, raw' devolvía las HOJAS del boniato, y 'sweet potato, raw,
  // unprepared' también: USDA lo escribe **en una sola palabra**. Por eso el
  // script imprime el nombre que trae: hay que mirarlo.
  ['sweetpotato, raw, unprepared', 'Batata cruda'],
  ['guavas, common, raw', 'Guayaba'],
  ['papayas, raw', 'Papaya'],
  ['mangos, raw', 'Mango'],
  ['avocados, raw, all commercial varieties', 'Aguacate'],
  ['passion-fruit, (granadilla), purple, raw', 'Maracuyá'],
  ['pineapple, raw, all varieties', 'Piña'],
  ['blackberries, raw', 'Mora'],
  ['oranges, raw, all commercial varieties', 'Naranja'],
  ['tomatoes, red, ripe, raw, year round average', 'Tomate'],
  ['onions, raw', 'Cebolla'],
  ['carrots, raw', 'Zanahoria'],
  // 'long-grain' con guion devolvía el crudo, que lleva el triple de
  // carbohidratos. Sin el guión USDA encuentra el cocido.
  ['rice, brown, medium-grain, cooked', 'Arroz integral cocido'],
  // El '%' y la barra daban HTTP 400 en la búsqueda.
  ['beef, ground, lean, raw', 'Carne de res magra'],
  ['pork, fresh, loin, tenderloin, separable lean only, raw', 'Lomo de cerdo'],
  ['fish, tilapia, raw', 'Tilapia'],
  ['cheese, queso fresco', 'Queso fresco'],
  ['corn, sweet, yellow, raw', 'Maíz tierno'],
]

const valor = (food, id) => food.foodNutrients?.find((n) => n.nutrientId === id)?.value

const { existsSync, readFileSync, writeFileSync } = await import('node:fs')
const FICHERO = 'scripts/frescos-usda.json'

// **Continúa donde se quedó.** Antes empezaba de cero y reescribía el fichero
// con lo que trajera esa vuelta: volvía a pedir los que ya tenía, se chocaba
// con el mismo límite en el mismo sitio y no avanzaba nunca.
const salida = existsSync(FICHERO) ? JSON.parse(readFileSync(FICHERO, 'utf8')) : []
const yaEstan = new Set(salida.map((ficha) => ficha.nombre))

if (yaEstan.size > 0)
  console.log(`  ${yaEstan.size} ya estaban; se piden los que faltan.
`)

for (const [consulta, nombre] of QUIERO) {
  if (yaEstan.has(nombre)) continue

  const url = `${BASE}?query=${encodeURIComponent(consulta)}&dataType=${encodeURIComponent('Foundation,SR Legacy')}&pageSize=1&api_key=DEMO_KEY`
  const res = await fetch(url)

  if (!res.ok) {
    console.log(`  ${nombre.padEnd(22)} HTTP ${res.status} — se para aquí`)
    break
  }

  const datos = await res.json()
  const food = datos.foods?.[0]

  if (!food) {
    console.log(`  ${nombre.padEnd(22)} sin resultado`)
    continue
  }

  const ficha = {
    nombre,
    usda: food.description,
    fdcId: food.fdcId,
    kcal: valor(food, 1008),
    prot: valor(food, 1003),
    carb: valor(food, 1005),
    gras: valor(food, 1004),
    fibra: valor(food, 1079),
  }

  // **Sin calorías no se guarda.** Un `undefined` acaba en el diario de alguien
  // como una comida que no suma nada. Pasó con el arroz.
  if (typeof ficha.kcal !== 'number') {
    console.log(`  ${nombre.padEnd(22)} DESCARTADO · sin calorías · ${food.description}`)
    continue
  }

  // **Y se comprueba que lo que llega es lo que se pidió.** El buscador de USDA
  // devuelve el primer resultado sea o no del alimento: «sweet potato» trajo las
  // HOJAS del boniato y «sweetpotato» trajo espárragos congelados. Una guarda de
  // calorías no lo pilla, porque los espárragos tienen calorías.
  //
  // Basta con el sustantivo —lo que va antes de la primera coma, sin espacios ni
  // guiones—: si no aparece en el nombre que devuelve USDA, no es el alimento.
  const sustantivo = consulta.split(',')[0].replaceAll(' ', '').replaceAll('-', '')
  const devuelto = food.description.toLowerCase().replaceAll(' ', '').replaceAll('-', '')

  if (!devuelto.includes(sustantivo)) {
    console.log(`  ${nombre.padEnd(22)} DESCARTADO · no es lo pedido · ${food.description}`)
    continue
  }

  // **Crudo y cocido no son el mismo alimento.** El arroz integral crudo lleva
  // 76,7 g de carbohidratos por cada cien y el cocido, unos 23: apuntar uno por
  // el otro triplica el día. Pedir 'cooked' y recibir 'raw' se descarta.
  let estadoMal = false
  for (const estado of ['raw', 'cooked']) {
    if (consulta.includes(estado) && !food.description.toLowerCase().includes(estado)) {
      console.log(`  ${nombre.padEnd(22)} DESCARTADO · pedido ${estado} · ${food.description}`)
      estadoMal = true
    }
  }
  if (estadoMal) continue

  // **Y una parte de la planta no es otra.** 'sweet potato' devolvió las hojas,
  // que son verdura de hoja y no un tubérculo: 42 kcal contra 86. Si el nombre
  // trae una parte que no se pidió, no es lo que se busca.
  const partes = ['leaves', 'leaf', 'seeds', 'flowers', 'skin', 'juice', 'sprouts']
  const parteSobrante = partes.find(
    (parte) => food.description.toLowerCase().includes(parte) && !consulta.includes(parte),
  )

  if (parteSobrante) {
    console.log(`  ${nombre.padEnd(22)} DESCARTADO · trae «${parteSobrante}» · ${food.description}`)
    continue
  }

  salida.push(ficha)
  console.log(
    `  ${nombre.padEnd(22)} ${String(ficha.kcal).padStart(5)} kcal · ${ficha.prot} P · ${ficha.carb} C · ${ficha.gras} G  ← ${food.description.slice(0, 46)}`,
  )

  await new Promise((listo) => setTimeout(listo, 300))
}

// Se guarda pase lo que pase: si el límite cortó a mitad, lo traído se queda y
// la vuelta siguiente sigue por donde iba.
writeFileSync(FICHERO, JSON.stringify(salida, null, 2), 'utf8')
console.log(`\n  ${salida.length} de ${QUIERO.length} encontrados.`)

const faltan = QUIERO.filter(([, nombre]) => !salida.some((ficha) => ficha.nombre === nombre))
if (faltan.length > 0) {
  console.log(`  Faltan ${faltan.length}: ${faltan.map(([, n]) => n).join(', ')}`)
  console.log('  El límite de la clave de demostración se repone cada hora.')
}
