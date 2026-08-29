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
  // 'sweet potato, raw' devolvia las HOJAS del boniato, no el tuberculo. Por
  // eso el script imprime el nombre que trae USDA: hay que mirarlo.
  ['sweet potato, raw, unprepared', 'Batata cruda'],
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
  ['rice, brown, long-grain, cooked', 'Arroz integral cocido'],
  ['beef, ground, 90% lean meat / 10% fat, raw', 'Carne de res magra'],
  ['pork, fresh, loin, tenderloin, separable lean only, raw', 'Lomo de cerdo'],
  ['fish, tilapia, raw', 'Tilapia'],
  ['cheese, queso fresco', 'Queso fresco'],
  ['corn, sweet, yellow, raw', 'Maíz tierno'],
]

const valor = (food, id) => food.foodNutrients?.find((n) => n.nutrientId === id)?.value

const salida = []

for (const [consulta, nombre] of QUIERO) {
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

  salida.push(ficha)
  console.log(
    `  ${nombre.padEnd(22)} ${String(ficha.kcal).padStart(5)} kcal · ${ficha.prot} P · ${ficha.carb} C · ${ficha.gras} G  ← ${food.description.slice(0, 46)}`,
  )

  await new Promise((listo) => setTimeout(listo, 300))
}

const { writeFileSync } = await import('node:fs')
writeFileSync('scripts/frescos-usda.json', JSON.stringify(salida, null, 2), 'utf8')
console.log(`\n  ${salida.length} de ${QUIERO.length} encontrados.`)
