#!/usr/bin/env node
/**
 * Tope de peso del paquete.
 *
 * Nexus se instala en el teléfono y **se descarga entero la primera vez**, así
 * que el peso no es una métrica de vanidad: es lo que tarda alguien con datos
 * móviles en poder usarla. Sin un tope, crece de PR en PR sin que nadie lo note
 * hasta que un día pesa el doble.
 *
 * Mide lo que el service worker precachea, que es exactamente lo que el
 * teléfono baja al instalar. **Las ilustraciones no entran** porque están fuera
 * del precacheo a propósito (`globIgnores`): se piden al abrir un ejercicio.
 *
 * Si el tope se queda corto porque entró algo que de verdad hacía falta, se
 * sube **a mano y en el mismo PR** que lo trae, explicando por qué. Eso es lo
 * que convierte el número en una decisión en vez de en un obstáculo.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** En KiB. Con margen sobre lo que pesa hoy, pero no tanto como para no avisar. */
const BUDGET_KIB = 1700

const swPath = resolve('dist/sw.js')

let sw
try {
  sw = readFileSync(swPath, 'utf8')
} catch {
  console.error('No encuentro dist/sw.js. Hay que construir antes: npm run build')
  process.exit(1)
}

// El manifiesto del precacheo lleva cada archivo con su tamaño en la revisión,
// pero no siempre; se mide sobre el disco, que es la verdad.
const files = [...sw.matchAll(/["']([^"']*assets\/[^"']+)["']/g)].map((m) => m[1])
const unique = [...new Set(files)]

if (unique.length === 0) {
  console.error('No he sabido leer qué precachea dist/sw.js. Revisa este script.')
  process.exit(1)
}

let total = 0
const sizes = []
for (const file of unique) {
  try {
    const bytes = readFileSync(resolve('dist', file.replace(/^\//, ''))).length
    total += bytes
    sizes.push({ file, kib: bytes / 1024 })
  } catch {
    // Un archivo del manifiesto que no está en disco es un fallo del build.
    console.error(`El service worker precachea ${file}, que no existe en dist/.`)
    process.exit(1)
  }
}

const totalKib = total / 1024
const biggest = sizes.sort((a, b) => b.kib - a.kib).slice(0, 3)

console.log(`Precacheado: ${totalKib.toFixed(1)} KiB de ${BUDGET_KIB} KiB permitidos.`)
console.log('Lo que más pesa:')
for (const { file, kib } of biggest) console.log(`  ${kib.toFixed(1).padStart(8)} KiB  ${file}`)

if (totalKib > BUDGET_KIB) {
  console.error(
    `\nEl paquete se pasa ${(totalKib - BUDGET_KIB).toFixed(1)} KiB del tope.\n` +
      'O adelgaza lo que entró, o sube BUDGET_KIB en este mismo PR explicando por qué.',
  )
  process.exit(1)
}
