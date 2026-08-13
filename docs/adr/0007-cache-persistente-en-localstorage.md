# ADR-0007 · La caché se persiste en `localStorage`

**Estado:** Aceptado · **Fecha:** 2026-08-05

## Contexto

Nexus es **offline-first**: abrir la app sin señal tiene que enseñar lo último
que se sabe, no una pantalla vacía. Para eso hay que **persistir la caché** de
TanStack Query entre sesiones ([13 · Offline y PWA](../13-offline-y-pwa.md)).

Ese documento dejó la elección de librería abierta a propósito (YAGNI) y pidió
justificarla aquí. Las candidatas eran el persister síncrono sobre
`localStorage` o el asíncrono sobre IndexedDB con una utilidad tipo `idb-keyval`.

## Medición

Se midió la caché real en el navegador, con ~10 semanas de datos sembrados y tras
abrir la pantalla más pesada (Analytics a 90 días):

| Consultas en caché | Serializado | La más pesada            |
| ------------------ | ----------- | ------------------------ |
| 12                 | **34,2 KB** | `nutrition/days`, 4,1 KB |

Y ya con la persistencia funcionando, tras recorrer la aplicación entera con
varios periodos, lo realmente guardado en disco fueron **128,7 KB**: un 2,5 % del
techo de ~5 MB de `localStorage`.

Lo que se guarda son **resultados ya agregados**, no las filas crudas: las ~2.300
filas que Analytics descarga se reducen a unas series de unos pocos KB.

## Decisión

Se persiste con **`@tanstack/query-sync-storage-persister` sobre `localStorage`**,
enchufado con `@tanstack/react-query-persist-client`.

- Son **dos paquetes de la librería que ya está en el stack**, versionados con
  ella. No entra un proveedor nuevo ni una API que aprender.
- IndexedDB (`idb-keyval` o Dexie) resolvería un problema de tamaño que **los
  números dicen que no existe**, a cambio de una dependencia más y de volver
  asíncrona la hidratación.

Cuatro detalles que la hacen segura:

- **Se borra al cerrar sesión.** La caché guarda datos de salud en claro en el
  dispositivo; si sobreviviera al logout, la siguiente persona que entrase en ese
  navegador vería el historial de la anterior. La RLS protege el servidor, no el
  disco.
- **Lleva firmado de quién es** (`nexus.cache-owner`), y si no coincide con quien
  tiene la sesión se tira antes de tocarla. Añadido cuando se supo que iban a ser
  **dos cuentas** —una por persona, sesiones distintas—, quizá en un mismo
  ordenador. Borrar al cerrar sesión da por hecho que siempre se pasa por ahí;
  esto no supone nada sobre el orden de los eventos, sólo pregunta de quién es lo
  que hay. Con un único usuario la diferencia era invisible.
- **`maxAge` de 7 días.** Es seguro porque las claves de lo que cambia a diario
  llevan la fecha dentro (`day(userId, '2026-08-05')`): una caché vieja no puede
  hacerse pasar por la de hoy, simplemente no existe para la clave de hoy. Lo que
  sí sobrevive son catálogos e históricos, donde ver la última versión conocida
  es justo lo que se quiere sin red.
- **`buster` con la versión del formato.** Cambiar la forma de lo que se cachea
  invalida lo guardado, en vez de rehidratar datos que ya no encajan.

## Consecuencias

**Positivas:** abrir sin red enseña lo último conocido; desaparece el caso más
común del aviso «Sin conexión»; sin dependencias nuevas de terceros.

**Negativas / coste:** `localStorage` es síncrono, así que escribir la caché
bloquea el hilo principal. Con 34 KB es imperceptible; con megabytes no lo sería.
Además vive en claro en el disco: mitigado borrándola al cerrar sesión.

**Cuándo revisar esta decisión:** si la caché se acerca al megabyte —por muchas
más pantallas, o por cachear filas crudas en vez de agregados—, o si aparece un
requisito de cifrado en reposo. La salida es cambiar el persister por el
asíncrono de IndexedDB **sin tocar nada más**: el resto de la app no sabe dónde
se guarda.

## Alternativas descartadas

- **IndexedDB con `idb-keyval`:** más capacidad y sin bloquear, pero resuelve un
  problema que la medición descarta. Es la salida natural si algún día hace falta.
- **Dexie:** una dependencia grande para guardar un único blob; desproporcionado.
- **No persistir:** deja la app inservible sin señal, que es justo lo contrario de
  lo que promete ser.

## Referencias

[13 · Offline y PWA](../13-offline-y-pwa.md) ·
[Política de dependencias](../10-stack-tecnologico.md#política-de-dependencias) ·
[ADR-0006](./0006-analytics-agrega-en-el-cliente.md) (mismo criterio: medir antes
de complicar)
