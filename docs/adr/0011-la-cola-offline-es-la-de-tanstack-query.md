# ADR-0011 · La cola offline es la de TanStack Query, no una propia

**Estado:** Aceptado · **Fecha:** 2026-08-15

## Contexto

El [ADR-0004](0004-estrategia-offline-first.md) fijó la estrategia offline-first
y **aplazó a propósito dos decisiones**: qué librería de persistencia usar y
dónde vive exactamente la cola. Este ADR las cierra.

Lo que hace hoy la aplicación sin conexión, comprobado en el navegador antes de
diseñar nada:

| Momento                           | Comportamiento                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Se toca «Vaso · 250 ml» sin red   | La mutación **se pausa**: el botón queda deshabilitado y el agua sigue en `0 ml`. Parece que la aplicación se colgó. |
| Vuelve la red                     | No se envía.                                                                                                         |
| Se cierra y se abre la aplicación | El registro **no existe**.                                                                                           |

El diagnóstico importa porque cambia la solución: **el dato no se pierde por
falta de cola** —TanStack Query ya pausa la mutación— sino por tres piezas que
faltan alrededor.

## Decisión

**No se construye una cola propia ni se añade IndexedDB.** La cola es el
`MutationCache` de TanStack Query, que ya está en el proyecto y ya se persiste
([ADR-0007](0007-cache-persistente-en-localstorage.md)). Lo que se añade son las
piezas que le faltan:

1. **`mutationKey` + `setMutationDefaults`.** Una mutación pausada se guarda con
   sus variables, pero **no con su función**: al restaurar, TanStack sólo sabe
   ejecutarla si la clave tiene un `mutationFn` registrado. Sin esto lo guardado
   es inservible, y es la razón por la que hoy se pierde.
2. **Variables completas y serializables.** Lo que hoy se captura del closure
   (`date`, `now`, `userId`) pasa a viajar **dentro de las variables**: al
   reanudar tras recargar no hay closure que valga.
3. **Aplicación optimista.** El registro se ve en el acto, con o sin red.
4. **Un indicador de lo pendiente**, para que «pendiente de enviar» sea un
   estado visible y no una sospecha.

**El dueño viaja en las variables y se comprueba al reanudar**, por el mismo
motivo que la caché lleva firmado el suyo
([ADR-0010](0010-la-cache-lleva-firmado-su-dueno.md)): lo pendiente de una
sesión no puede enviarse en nombre de quien entre después.

### Qué se encola y qué no

Sólo **registrar**, que es lo que la constitución exige que funcione sin red y
lo que de verdad ocurre en la calle: agua, comidas, series, hábitos, sueño,
estudio, gastos. **La configuración no se encola** —crear rutinas, editar
presupuestos, dar de alta materias— porque se hace sentado en casa y porque
devuelve filas que la pantalla necesita en el momento.

## Sobre el ADR-0004

El ADR-0004 decía que **los repositorios** serían la costura online/offline, y
la costura queda en la **mutación**. El motivo es que se escribió antes de mirar
qué traía TanStack Query: una cola bajo los repositorios obligaría a inventar un
formato de tarea serializable por operación y a mantenerlo, teniendo al lado un
mecanismo que ya hace eso.

**La arquitectura no cambia:** `repository → service → hook → componente` sigue
igual, y las capas de arriba siguen sin saber si hay red. Lo que se pausa es la
llamada entera, no un trozo de ella.

## Consecuencias

**Positivas:** cero dependencias nuevas y cero código de cola que mantener; el
mecanismo es el de la librería, con sus reintentos y su reanudación; lo que se
guarda sigue siendo `localStorage`, ya medido y ya limpiado al cerrar sesión.

**Negativas / coste:** las mutaciones encolables **no pueden capturar nada del
closure**, lo que las hace más verbosas que las de configuración; y hay dos
formas de escribir una mutación en el proyecto, así que la diferencia tiene que
quedar clara en el código. El límite de `localStorage` (~5 MB, compartido con la
caché) es de sobra para una cola de registros, que son unas pocas líneas por
entrada, pero **es un límite compartido**: si algún día la caché creciera, la
cola es lo que no puede perderse.

## Alternativas descartadas

- **Cola propia en IndexedDB** (lo que sugería el ADR-0004): más control, pero
  hay que escribir y mantener el serializado, el orden, los reintentos y la
  reanudación — todo lo que la librería ya trae.
- **Encolarlo todo, también la configuración:** obligaría a que ninguna mutación
  pudiera devolver la fila creada, y varias pantallas la usan.

## Referencias

[ADR-0004](0004-estrategia-offline-first.md) ·
[ADR-0007](0007-cache-persistente-en-localstorage.md) ·
[ADR-0010](0010-la-cache-lleva-firmado-su-dueno.md) ·
[13 · Offline y PWA](../13-offline-y-pwa.md)
