/** Búsqueda tolerante: ignora mayúsculas y acentos («biceps» encuentra «Bíceps»). */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** ¿El texto contiene la búsqueda? Una búsqueda vacía acepta cualquier texto. */
export function matchesQuery(text: string, query: string): boolean {
  const target = normalize(query).trim()
  return target === '' || normalize(text).includes(target)
}
