# ADR-0009 · El movimiento se hace con CSS, no con framer-motion

**Estado:** Aceptado · **Fecha:** 2026-08-13

## Contexto

`framer-motion` figura en el stack obligatorio del `CLAUDE.md` desde la Fase 1.
Al cerrar el Sprint 16 seguía instalada y **sin una sola importación** en todo
`src`, después de diecisiete sprints.

Antes de decidir se buscó un uso que la justificara. Sólo hay dos cosas que CSS
no sabe hacer y ella sí:

1. **Animar la salida de algo que se desmonta.** CSS no puede porque el nodo ya
   no está; hace falta que alguien lo retenga (`AnimatePresence`).
2. **Animar el reacomodo de una lista** cuando un elemento cambia de sitio
   (`layout`, con la técnica FLIP).

Ambas se dan en el mismo sitio: **descartar una recomendación** en el panel y en
Plan. La tarjeta desaparecía de golpe y las de abajo daban un salto, sin que se
entendiera qué se había ido. Las demás capacidades de la librería —gestos de
arrastre, animaciones ligadas al scroll, muelles— no tienen ningún uso en Nexus.

## La medición

Se prototipó el caso real con `AnimatePresence` y `layout`, y se comparó el
`build`:

| Trozo `planning` (el del panel de entrada) | gzip         |
| ------------------------------------------ | ------------ |
| Sin `framer-motion`                        | **8,20 KB**  |
| Con `framer-motion`                        | **48,85 KB** |

**+40,65 KB gzip**, casi seis veces el trozo. Y se pagan en la **pantalla de
entrada**, porque `TodayFocus` vive ahí: sobre los 193 KB de la primera visita es
un **+21 %**.

`LazyMotion` lo dejaría en unos 25 KB, pero `layout` exige el paquete grande
(`domMax`) y obliga a usar `m.div` en lugar de `motion.div` **en toda la
aplicación para siempre**, so pena de volver a meter el paquete entero sin darse
cuenta. Una restricción permanente que hay que recordar, para seguir pagando 25
KB.

## Decisión

**Se retira `framer-motion` del proyecto y del stack obligatorio.**

El movimiento se resuelve con lo que ya había: tokens (`--duration-fast`,
`--duration-base`, `--duration-slow`, `--ease-out`), utilidades de Tailwind y
`tailwindcss-animate`. Son las 33 animaciones que la aplicación ya tenía, todas
con `prefers-reduced-motion` respetado desde `globals.css`.

El caso que la justificaba se implementó sin ella, y hay una arista que conviene
recordar: **retener el nodo hay que hacerlo a mano**. La primera versión aplicaba
la clase de salida y guardaba a la vez, y la transición no llegaba a verse nunca
—comprobado en el navegador: cero eventos de transición—, porque al guardar se
refresca el plan y React desmonta la tarjeta antes del primer fotograma. La
solución es esperar a que termine de irse y **luego** guardar, saltándose la
espera si se pidió menos movimiento (`prefersReducedMotion()`, en `shared/utils`).

## Consecuencias

- Una dependencia menos: 4,6 MB y 382 archivos fuera de cada instalación y de
  cada arranque de CI.
- **Las animaciones de salida cuestan trabajo manual.** Si algún día hay tres o
  cuatro sitios que necesiten retener el nodo, la pieza compartida sale sola; si
  llegan a ser muchos más, o aparece un caso de gestos o de reordenación de
  listas, volver a traerla es `npm i framer-motion` y este documento explica qué
  se estaba pagando a cambio.
- No cambia ninguna animación existente: ninguna dependía de ella.
