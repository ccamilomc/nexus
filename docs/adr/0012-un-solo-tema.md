# ADR-0012 · Nexus tiene un solo tema, y es oscuro

- **Estado:** aceptado
- **Fecha:** 2026-08-27
- **Sustituye a:** la regla de [11 · UX/UI](../11-ux-ui-y-diseno.md) que decía
  «dark mode es el tema principal; light mode está soportado», y la línea
  equivalente del [CLAUDE.md](../../CLAUDE.md).

## Contexto

Nexus nació con dos temas y un selector en Ajustes. Al cabo de un mes en
producción, con la aplicación instalada en el teléfono, **ninguno de los dos
usuarios había usado el claro**, y el propietario pidió quitarlo: _«no hace
falta ni quiero tema claro, sólo que haya uno y único»_.

Su motivo era ahorrar peso. **Ese motivo no se sostiene**, y conviene dejarlo
escrito para que nadie lo repita como si fuera cierto: el bloque del tema claro
ocupaba 2,2 KB sin comprimir —bastante menos de 1 KB al descargarse, sobre 193
KB de primera visita—, y la maquinaria del selector, otro tanto. Como ahorro es
ruido.

## Decisión

Un solo tema, oscuro, definido en `:root` sin ninguna clase que lo active.

El motivo que sí lo justifica es otro: **cada cambio obligaba a comprobar dos
pantallas**. Y no en abstracto — los fallos de contraste que ha tenido este
proyecto salieron **siempre en el tema claro**: el rojo a 3,8:1, el ámbar a
2,9:1, el patrón de texto atenuado sobre fondo atenuado. El tema oscuro no dio
ninguno. Mantener el claro significaba seguir pagando esa revisión, y pagarla en
el tema que nadie mira.

Se quita también `core/theme` entero: proveedor, almacén, selector y el
`resolve-theme` que decidía entre la preferencia y la del sistema.

## Consecuencias

- **Cada pantalla nueva se comprueba una vez.** Es lo que se venía a ganar.
- `color-scheme: dark` en `:root` le dice al navegador que pinte en oscuro lo
  que dibuja él —barras de desplazamiento, selectores de fecha, autocompletado—,
  que antes lo resolvía la clase del tema.
- **La preferencia del sistema se ignora a propósito.** Quien tenga el teléfono
  en claro verá Nexus en oscuro igualmente. Es la contrapartida aceptada.
- **Se pierde legibilidad a pleno sol.** Un tema oscuro se lee peor en la calle
  o en un gimnasio con ventanales; nadie lo ha echado en falta todavía, pero es
  el coste real de esta decisión y no otro.
- **Volver atrás es barato mientras los componentes no usen colores directos.**
  Hoy no hay ni una variante `dark:` en toda la aplicación: todo pasa por los
  tokens. Mientras eso siga así, recuperar el segundo tema es volver a poner un
  bloque de valores. **Si alguien empieza a escribir colores a mano en los
  componentes, esa puerta se cierra.**

## Alternativas descartadas

- **Dejar el claro y no mirarlo.** Es lo que ya pasaba de hecho, y es peor que
  quitarlo: la aplicación seguiría prometiendo un tema que nadie comprueba, y
  quien lo activara se encontraría los fallos.
- **Seguir la preferencia del sistema sin selector.** Habría dejado los dos
  temas vivos con el mismo coste de revisión, ganando sólo una pantalla de
  ajustes.
