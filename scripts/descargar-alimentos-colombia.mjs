#!/usr/bin/env node
/**
 * Trae de Open Food Facts los productos que se venden en Colombia.
 *
 * **Se ejecuta a mano y de vez en cuando**, no en cada despliegue: es una foto
 * de una base que se mueve despacio, y la gracia es justo que Nexus no dependa
 * de que ellos estén arriba.
 *
 * Por qué hace falta: el buscador por nombre de Open Food Facts **no se puede
 * llamar desde el navegador** —no manda cabecera CORS— y el buscador viejo
 * lleva caído desde abril de 2026. Desde un script sí se puede, así que se trae
 * una vez lo que interesa y se guarda aquí.
 *
 * Los datos son de Open Food Facts, con licencia ODbL: pide atribución y
 * compartir igual lo derivado.
 *
 *     node scripts/descargar-alimentos-colombia.mjs
 */
import { writeFileSync } from 'node:fs'

const BASE = 'https://search.openfoodfacts.org/search'
const POR_PAGINA = 100
// Dentro de la feature: lo consume Nutrición y viaja con ella en su propio
// trozo, que sólo se baja cuando alguien busca o escanea.
const SALIDA = 'src/features/nutrition/data/alimentos-colombia.json'

/** Lo que se pide: sin esto llegan cien campos por producto y sobran noventa. */
const CAMPOS = ['code', 'product_name', 'brands', 'nutriments', 'quantity'].join(',')

/** Un producto sirve si se puede escribir en la ficha de un alimento. */
function usable(hit) {
  const n = hit.nutriments ?? {}
  const nombre = (hit.product_name ?? '').trim()

  return (
    nombre.length > 1 &&
    nombre.length <= 80 &&
    // El código es la clave para el escáner: sin él, el producto no sirve.
    /^\d{8,14}$/.test(hit.code ?? '') &&
    typeof n['energy-kcal_100g'] === 'number' &&
    typeof n.proteins_100g === 'number' &&
    typeof n.carbohydrates_100g === 'number' &&
    typeof n.fat_100g === 'number' &&
    // Cifras imposibles: hay fichas mal escritas por gente, y una barrita de
    // 9.000 kcal por cada cien gramos ensucia el buscador para siempre.
    n['energy-kcal_100g'] > 0 &&
    n['energy-kcal_100g'] <= 900 &&
    n.proteins_100g >= 0 &&
    n.proteins_100g <= 100 &&
    n.carbohydrates_100g >= 0 &&
    n.carbohydrates_100g <= 100 &&
    n.fat_100g >= 0 &&
    n.fat_100g <= 100 &&
    coherente(n)
  )
}

/**
 * Que las calorías y los macros cuenten la misma historia.
 *
 * Open Food Facts lo escribe gente, y hay fichas donde no cuadran: «La Lechera,
 * 0 kcal y 56,7 g de carbohidratos», o una arepa que dice 233 kcal cuando sus
 * macros dan 994. Una de las dos cifras está mal y **no hay forma de saber
 * cuál**, así que el producto se descarta: inventar el dato bueno sería meter un
 * número falso en el diario de alguien.
 *
 * Se calcula por Atwater —4 kcal por gramo de proteína y de carbohidrato, 9 por
 * gramo de grasa— con un margen ancho del 30 %: la fibra, los polialcoholes y el
 * redondeo de las etiquetas hacen que la cuenta nunca salga exacta.
 */
function coherente(n) {
  const declaradas = n['energy-kcal_100g']
  const porMacros = n.proteins_100g * 4 + n.carbohydrates_100g * 4 + n.fat_100g * 9

  // Agua, gaseosa sin azúcar, café solo: cero de todo y es verdad.
  if (declaradas < 20 && porMacros < 20) return true

  return porMacros >= declaradas * 0.7 && porMacros <= declaradas * 1.3
}

const redondear = (valor) => Math.round(valor * 10) / 10

function aFicha(hit) {
  const n = hit.nutriments
  // `brands` llega como lista en este servicio y como texto con comas en el
  // viejo. Se acepta lo uno y lo otro, y se queda la primera marca.
  const marcas = Array.isArray(hit.brands) ? hit.brands : String(hit.brands ?? '').split(',')
  const marca = (marcas[0] ?? '').trim()

  return {
    codigo: hit.code,
    nombre: hit.product_name.trim(),
    ...(marca ? { marca: marca.slice(0, 40) } : {}),
    kcal: Math.round(n['energy-kcal_100g']),
    prot: redondear(n.proteins_100g),
    carb: redondear(n.carbohydrates_100g),
    gras: redondear(n.fat_100g),
    ...(typeof n.fiber_100g === 'number' && n.fiber_100g >= 0 && n.fiber_100g <= 100
      ? { fibra: redondear(n.fiber_100g) }
      : {}),
  }
}

async function pagina(numero) {
  const url = `${BASE}?q=countries_tags%3A%22en%3Acolombia%22&page=${numero}&page_size=${POR_PAGINA}&fields=${CAMPOS}`

  for (let intento = 1; intento <= 3; intento += 1) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    // El servicio va justo de carga; un respiro y otra vez.
    await new Promise((listo) => setTimeout(listo, 2000 * intento))
  }

  throw new Error(`La página ${numero} no llegó después de tres intentos.`)
}

const primera = await pagina(1)
const total = primera.count
const paginas = Math.ceil(total / POR_PAGINA)
console.log(`Productos colombianos en Open Food Facts: ${total} (${paginas} páginas)`)

/**
 * La misma clave para el mismo producto.
 *
 * Open Food Facts tiene **cuatro fichas de Chocoramo**, con cuatro códigos y
 * cuatro cifras distintas: 425, 440, 444 y 446 kcal. Son la misma galleta, y
 * enseñar las cuatro obliga a elegir entre números que no se pueden comparar.
 */
const clave = (ficha) =>
  `${ficha.nombre} ${ficha.marca ?? ''}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Cuánto se desvía una ficha de su propia cuenta.
 *
 * Entre dos fichas del mismo producto se queda **la que mejor cuadra consigo
 * misma**: no hay forma de saber cuál es la verdad, pero sí de descartar la que
 * peor se sostiene.
 */
const desviacion = (ficha) => {
  const porMacros = ficha.prot * 4 + ficha.carb * 4 + ficha.gras * 9

  return ficha.kcal < 1 ? 0 : Math.abs(porMacros - ficha.kcal) / ficha.kcal
}

const porCodigo = new Map()
let vistos = 0

for (let numero = 1; numero <= paginas; numero += 1) {
  const datos = numero === 1 ? primera : await pagina(numero)
  const hits = datos.hits ?? []
  vistos += hits.length

  for (const hit of hits) {
    // El mismo producto puede aparecer dos veces; manda el primero.
    if (usable(hit) && !porCodigo.has(hit.code)) porCodigo.set(hit.code, aFicha(hit))
  }

  if (numero % 5 === 0 || numero === paginas) {
    console.log(`  página ${numero}/${paginas} · vistos ${vistos} · sirven ${porCodigo.size}`)
  }
}

// Una ficha por producto: de las repetidas se queda la que mejor cuadra.
const porProducto = new Map()
for (const ficha of porCodigo.values()) {
  const k = clave(ficha)
  const anterior = porProducto.get(k)
  if (!anterior || desviacion(ficha) < desviacion(anterior)) porProducto.set(k, ficha)
}

const repetidas = porCodigo.size - porProducto.size

// Por nombre, que es como se leerá el archivo si alguien lo abre.
const alimentos = [...porProducto.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

writeFileSync(SALIDA, `${JSON.stringify(alimentos)}\n`, 'utf8')

const bytes = Buffer.byteLength(JSON.stringify(alimentos))
console.log(`\nGuardados ${alimentos.length} de ${vistos} vistos en ${SALIDA}`)
console.log(`Se juntaron ${repetidas} fichas repetidas del mismo producto.`)
console.log(`Pesa ${(bytes / 1024).toFixed(0)} KiB sin comprimir.`)
