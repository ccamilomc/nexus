/**
 * Bajar un texto como archivo, sin servidor de por medio.
 *
 * Se hace en el navegador a propósito: exportar es de las pocas cosas que
 * tienen que funcionar **sin conexión**, y pedírselo al servidor la rompería
 * justo el día que hace falta.
 *
 * El `revokeObjectURL` no es opcional: sin él, cada exportación deja el archivo
 * entero retenido en memoria hasta que se recargue la página.
 */
export function downloadTextFile(fileName: string, text: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }))
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  // Firefox sólo dispara la descarga si el enlace está en el documento.
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
