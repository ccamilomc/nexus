# ADR-0003 · La IA es una capa de interpretación, no de ejecución

**Estado:** Aceptado · **Fecha:** 2026-07-22

## Contexto

La IA aporta valor explicando y resumiendo, pero es no determinista, puede fallar,
tiene coste y latencia, y maneja datos personales. La lógica crítica no puede
depender de ella.

## Decisión

La IA se sitúa **por encima** del [Decision Engine](../06-decision-engine-e-ia.md)
y se limita a **interpretar, explicar, resumir y responder**. Concretamente:

- **No** ejecuta lógica crítica ni reemplaza al motor.
- **No** modifica registros automáticamente; toda acción la confirma el usuario.
- **No** inventa datos: muestra los datos usados y evita afirmaciones absolutas.
- Se implementa vía la feature `assistant` → `AiService` → **Edge Function**
  `ai-assistant` (que custodia la API key del proveedor).
- El sistema es **100% funcional con la IA desactivada** (degradación elegante).

## Consecuencias

**Positivas:** robustez (sin punto único de fallo en la lógica), seguridad (clave
sólo en servidor), coste controlado y confianza del usuario (transparencia).

**Negativas / coste:** funciones de IA "más ricas" requieren pasar por el servidor
y dependen de disponibilidad del proveedor; se asume porque la funcionalidad base
no depende de ellas.

## Alternativas descartadas

- **IA como cerebro del sistema:** no determinista y no verificable para reglas
  críticas; inaceptable para salud/hábitos.
- **Llamar al proveedor desde el cliente:** expondría la API key. Prohibido.

## Referencias

[06 · Decision Engine e IA](../06-decision-engine-e-ia.md) · [12 · Seguridad](../12-seguridad.md)
