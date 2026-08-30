import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'

import { QUERY_DEFAULTS } from './query-defaults'

const CLAVE = ['prueba', 'sin-senal'] as const

afterEach(() => {
  // Los dos son globales del proceso: dejarlos tocados contamina otras pruebas.
  onlineManager.setOnline(true)
  focusManager.setFocused(undefined)
})

/**
 * Espera a que la consulta **esté** pausada, en vez de a un reloj.
 *
 * No es quisquillosería: con una espera de cero milisegundos la consulta todavía
 * no se había pausado, los avisos de red y de foco pasaban de largo y luego se
 * pausaba sin nadie que la despertara. La prueba fallaba por la carrera, no por
 * lo que mide.
 */
async function esperarAQueSePause(client: QueryClient): Promise<void> {
  for (let intento = 0; intento < 50; intento += 1) {
    if (client.getQueryCache().find({ queryKey: CLAVE })?.state.fetchStatus === 'paused') return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  throw new Error('la consulta nunca se pauso')
}

/** Un cliente montado, que es lo que le suscribe a la red y al foco. */
function clienteMontado(): QueryClient {
  const client = new QueryClient({ defaultOptions: QUERY_DEFAULTS })
  // Sin `mount()` no se entera de que volvió la señal. En la aplicación lo llama
  // el `QueryClientProvider`.
  client.mount()

  return client
}

describe('lo que se pausó sin señal', () => {
  it('reanuda solo al volver la señal, con la app en pantalla', async () => {
    // **Esto era un «pendiente conocido» del roadmap que no existía.** Decía que
    // al volver la señal con la pantalla abierta había que recargar. Estaba
    // medido con el navegador oculto, y ahí TanStack no reanuda a propósito.
    focusManager.setFocused(true)
    onlineManager.setOnline(false)

    const client = clienteMontado()
    let salidas = 0
    const consulta = client.fetchQuery({
      queryKey: CLAVE,
      queryFn: async () => {
        salidas += 1
        return 'los datos'
      },
    })

    await esperarAQueSePause(client)
    // Sin red no sale: se queda pausada, que es lo que permite que la pantalla
    // diga «Sin conexión» en vez de fallar.
    expect(salidas).toBe(0)

    onlineManager.setOnline(true)

    await expect(consulta).resolves.toBe('los datos')
    expect(salidas).toBe(1)

    client.unmount()
  })

  it('sin foco no reanuda, y por eso la medida vieja engañaba', async () => {
    // `canContinue()` de TanStack exige las dos cosas: red **y** foco. Un
    // navegador oculto —headless, una pestaña de fondo, el panel de un agente—
    // nunca tiene lo segundo, así que devolver la red sola no despierta nada y
    // parece un fallo de la aplicación. No lo es: en un teléfono con la app en
    // pantalla el foco está puesto, y ahí manda la prueba de arriba.
    focusManager.setFocused(false)
    onlineManager.setOnline(false)

    const client = clienteMontado()
    let salidas = 0
    const consulta = client.fetchQuery({
      queryKey: CLAVE,
      queryFn: async () => {
        salidas += 1
        return 'los datos'
      },
    })

    await esperarAQueSePause(client)
    onlineManager.setOnline(true)
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(salidas).toBe(0)

    // Al volver a la pantalla —el `visibilitychange` de un móvil— sí arranca.
    focusManager.setFocused(true)

    await expect(consulta).resolves.toBe('los datos')
    expect(salidas).toBe(1)

    client.unmount()
  })
})
