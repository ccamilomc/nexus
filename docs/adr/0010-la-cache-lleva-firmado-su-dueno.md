# ADR-0010 · La caché guardada lleva firmado su dueño

**Estado:** Aceptado · **Fecha:** 2026-08-13

Complementa a [ADR-0007](./0007-cache-persistente-en-localstorage.md) y a
[ADR-0005](./0005-multiusuario-desde-el-diseno.md). No los sustituye: la caché
sigue viviendo en `localStorage` y sigue borrándose al cerrar sesión.

## Contexto

El ADR-0005 diseñó el sistema como multiusuario «sin construir aún las features
multiusuario», porque la v1 la usaba una sola persona. El 2026-08-13 eso cambió:
**van a ser dos cuentas reales**, la del usuario y la de su hermano, **cada una
con su sesión**. No es modo familiar ni perfiles dentro de una cuenta; son dos
sesiones independientes que no deben verse, y que pueden compartir un ordenador.

El servidor ya estaba bien. Se auditaron las políticas contra la base real: cero
tablas sin RLS o sin políticas, cero políticas que no filtren por `auth.uid()`, y
las tres tablas de catálogo (`exercises`, `foods`, `finance_categories`) sólo
dejan **leer** las filas globales, nunca escribirlas.

El disco era otra cosa. La caché persistida se borraba **al cerrar sesión**, y eso
es un razonamiento sobre **qué transición ocurrió**, no sobre **de quién es el
dato**: da por hecho que siempre se pasa por ahí. Además,
`PersistQueryClientProvider` está por fuera de `AuthProvider`, así que lo guardado
se restaura antes de saber quién ha entrado. Con un solo usuario, equivocarse en
esto no tenía consecuencias. Con dos, la caché lleva peso, comidas y sueño en
claro.

## Decisión

**Lo guardado lleva firmado su dueño** (`nexus.cache-owner`, junto a la caché).
Al arrancar con sesión, si la firma no coincide con quien la tiene, se tira todo
—memoria y disco— antes de tocarlo, y se firma de nuevo.

Deja de deducirse y se pregunta. La comprobación no supone nada sobre el orden de
los eventos.

Dos detalles que importan:

- **Sólo se tira si había algo.** En el primer arranque de alguien no hay nada
  guardado, y vaciar ahí tiraría lo que las pantallas acaban de pedir,
  obligándolas a pedirlo otra vez para nada.
- **Sin sesión se sigue borrando**, igual que antes. Una firma sin sesión detrás
  no vale: lo guardado es de alguien que ya no está.

## Consecuencias

**Positivas:** una cuenta no puede encontrarse los datos de la otra en el
dispositivo, aunque el cierre de sesión no llegara a completarse. Y el fallo, si
lo hubiera, sería siempre en la dirección segura: tirar de más, nunca de menos.

**Negativas / coste:** una clave más en `localStorage` y un borrado extra la
primera vez que alguien entra en un dispositivo donde ya había caché. Nada
perceptible.

**Cuándo revisar esta decisión:** si algún día se comparten datos entre cuentas
—modo familiar, entrenador—, la caché dejaría de tener un único dueño y esto
habría que repensarlo.

## Alternativas descartadas

- **Mover `PersistQueryClientProvider` dentro de `AuthProvider`** para no
  restaurar nada hasta saber quién entra. Es la solución de raíz, pero obliga a
  montar la persistencia después de resolver la sesión, con lo que se pierde la
  ventaja de tener datos en el primer fotograma —justo lo que el ADR-0007 buscaba.
- **Cifrar la caché con algo derivado del usuario.** Protege más, pero contra un
  atacante con acceso al dispositivo, que no es el escenario: aquí son dos
  hermanos compartiendo un ordenador, no un adversario. Coste alto, problema
  distinto.

## Referencias

[ADR-0005](./0005-multiusuario-desde-el-diseno.md) · [ADR-0007](./0007-cache-persistente-en-localstorage.md) · [12 · Seguridad](../12-seguridad.md)
