# Documentación técnica — Nexus

> **Estado:** Sprints 0–12 terminados (los seis dominios completos, conectados al dashboard y con analíticas), más el Plan del día. Siguiente: Sprint 13 (Decision Engine).
> **Versión del diseño:** 1.0
> **Fecha:** 2026-08-01

Esta carpeta es la **fuente de verdad** de la arquitectura de Nexus. La regla es
absoluta: **la documentación existe antes que el código** y nunca puede quedar
desactualizada respecto a él. Si una decisión cambia la arquitectura, primero se
actualiza el documento y después el código.

## Qué es Nexus

Nexus es un **sistema operativo personal adaptativo**: un único lugar para
gestionar entrenamiento, nutrición económica, hábitos, estudio, sueño y salud,
capaz de **recalcular el día** cuando algo falla, **sugerir cambios de comida**
dentro de un presupuesto y **proponer rutinas alternativas** de gimnasio.

No es una app de registro. Es un sistema que ayuda a **tomar mejores decisiones**.
El sistema recomienda; el usuario decide.

## Cómo leer esta documentación

Lee los documentos en orden si es tu primera vez. Cada uno tiene una única
responsabilidad y enlaza a los demás en lugar de repetir información (DRY).

| #   | Documento                                                | Responde a                                       |
| --- | -------------------------------------------------------- | ------------------------------------------------ |
| 01  | [Visión y alcance](./01-vision-y-alcance.md)             | ¿Qué construimos y qué **no**?                   |
| 02  | [Arquitectura](./02-arquitectura.md)                     | ¿Cómo se organiza el sistema y fluyen los datos? |
| 03  | [Estructura de carpetas](./03-estructura-de-carpetas.md) | ¿Dónde vive cada cosa?                           |
| 04  | [Modelo de datos](./04-modelo-de-datos.md)               | ¿Qué entidades existen y cómo se relacionan?     |
| 05  | [Base de datos](./05-base-de-datos.md)                   | Esquema físico, índices, RLS, migraciones        |
| 06  | [Decision Engine e IA](./06-decision-engine-e-ia.md)     | ¿Cómo "piensa" Nexus?                            |
| 07  | [Convenciones de código](./07-convenciones-de-codigo.md) | ¿Cómo escribimos el código?                      |
| 08  | [Convenciones de Git](./08-convenciones-de-git.md)       | ¿Cómo versionamos?                               |
| 09  | [Roadmap y Sprints](./09-roadmap-y-sprints.md)           | ¿En qué orden lo construimos?                    |
| 10  | [Stack tecnológico](./10-stack-tecnologico.md)           | ¿Con qué lo construimos y por qué?               |
| 11  | [UX/UI y diseño](./11-ux-ui-y-diseno.md)                 | ¿Cómo se ve y se siente?                         |
| 12  | [Seguridad](./12-seguridad.md)                           | ¿Cómo protegemos los datos?                      |
| 13  | [Offline y PWA](./13-offline-y-pwa.md)                   | ¿Cómo funciona sin conexión?                     |

### Registros de decisiones (ADR)

Las decisiones arquitectónicas de alto impacto se documentan en
[`adr/`](./adr/README.md). Un ADR explica el contexto, la decisión y sus
consecuencias, y es **inmutable** una vez aceptado (se supera con un ADR nuevo,
no se edita).

## Principios rectores (resumen)

La [constitución del proyecto](../CLAUDE.md) manda. En orden de prioridad:
**Correctitud → Arquitectura → Legibilidad → Escalabilidad → Mantenibilidad →
Seguridad → Performance → UX → Velocidad**. Nunca se invierte este orden.

## Convención de la documentación

- Idioma: **español**. Términos técnicos consolidados (hook, repository, service)
  se mantienen en inglés por convención de la industria.
- Los diagramas usan **Mermaid** (se renderizan en GitHub).
- Los nombres de archivo son `kebab-case` y van numerados por orden de lectura.
- Toda afirmación vive en **un solo documento**; el resto enlaza a él.
