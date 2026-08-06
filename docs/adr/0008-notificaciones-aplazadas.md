# ADR-0008 · Las notificaciones se aplazan hasta que haya push de verdad

**Estado:** Aceptado · **Fecha:** 2026-08-05

## Contexto

El Sprint 15 pedía «notificaciones» y este documento las describía así: **ayudan,
no molestan**, con prioridad para agua, entrenamientos, hábitos y estudio, y bajo
el control del usuario ([13 · Offline y PWA](../13-offline-y-pwa.md)). La base de
datos las lleva previstas desde el Sprint 3: `user_preferences.notifications_enabled`,
`user_preferences.reminder_times` y la tabla `notifications` con su enum
`notification_channel` (`in_app` | `push`).

Todo eso describe **recordatorios a una hora**. Al ir a implementarlos, la web
sólo ofrece dos caminos, y uno de ellos no existe:

1. **Notificaciones locales programadas.** Sería lo natural: el dispositivo se
   encarga y no hace falta servidor. La API que lo permitía —Notification
   Triggers, `TimestampTrigger`— se quedó en una prueba de origen de Chrome y
   **no está en ningún navegador**. No es una limitación de iOS: no existe.
2. **Web Push.** Es el único camino real, y es una pieza de servidor entera.

Hay un tercer camino que parece funcionar y no funciona: `setTimeout` en la
página más `showNotification`. Sólo dispara **con la aplicación abierta**, así
que avisa de beber agua justo a quien ya está mirando la pantalla. Es la
apariencia de la funcionalidad sin la funcionalidad.

## Decisión

**No se implementan notificaciones en el Sprint 15.** Se cierra el sprint con la
instalación (A2HS), que es la otra mitad, y las columnas y la tabla previstas
**se quedan sin usar a propósito**.

El motivo es el coste real de hacerlo bien. Web Push exige, como mínimo:

- una tabla `push_subscriptions` con su migración y su RLS;
- un par de claves **VAPID** guardadas como secretos del proyecto;
- una **Edge Function** que firme y envíe los mensajes;
- un **programador** (`pg_cron` + `pg_net`) barriendo cada pocos minutos para
  decidir a quién le toca, respetando su zona horaria y sin repetirse;
- en iOS, además, sólo funciona si la aplicación está **instalada** y con 16.4+.

Es un subsistema de servidor, no el remate de un sprint de PWA. Y sería la
**primera** escritura del proyecto a `user_preferences`, que hoy no tiene ni
repositorio ni servicio ni hook: el tema vive sólo en el navegador.

Es el mismo criterio con el que se paró el Sprint 14 y con el que espera la capa
de IA ([ADR-0003](./0003-ia-como-capa-de-interpretacion.md)): la aplicación
entera funciona sin esto, así que entra cuando pueda entrar bien.

## Consecuencias

**Positivas:** no se le pide al usuario el permiso de notificaciones a cambio de
nada —y negarlo una vez es difícil de deshacer—; no entra un programador de
servidor que corre aunque nadie abra la aplicación; el Sprint 15 se cierra con lo
que sí aporta.

**Negativas / coste:** Nexus no avisa de nada. Quien no la abra, no se entera. Es
una carencia real y conocida, no un olvido.

**Cuándo revisar esta decisión:** cuando de verdad se eche en falta que el
teléfono suene —típicamente con el agua o los hábitos— o cuando haya un segundo
usuario. Entonces se abre un sprint propio para Web Push, no una tarea al final
de otro.

## Alternativas descartadas

- **Sólo el interruptor en Ajustes**, pidiendo el permiso del navegador sin nada
  detrás que envíe. Es peor que no hacer nada: quema un permiso caro de
  recuperar a cambio de cero, y deja en pantalla una promesa que nadie cumple.
- **Canal `in_app`: una campanita con las recomendaciones del motor.** Ya están
  en pantalla, en el Plan y en el Dashboard. Sería duplicar lo que el Decision
  Engine ya dice, y llamarlo funcionalidad nueva.
- **Notificar al terminar un bloque de estudio.** Es el único aviso local que
  tendría sentido —el navegador puede dispararlo con la aplicación abierta en
  segundo plano—, pero el cronómetro de estudio es **abierto**: no tiene duración
  objetivo. Haría falta inventar un Pomodoro primero, y eso es alcance nuevo.

## Referencias

[13 · Offline y PWA](../13-offline-y-pwa.md) ·
[09 · Roadmap](../09-roadmap-y-sprints.md) ·
[ADR-0003](./0003-ia-como-capa-de-interpretacion.md) (mismo criterio: la
aplicación funciona entera sin la pieza que falta)
