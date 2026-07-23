# Architecture Decision Records (ADR)

Un ADR documenta una **decisión arquitectónica de alto impacto**: su contexto, la
decisión tomada, sus consecuencias y las alternativas descartadas.

## Reglas

- Un ADR aceptado es **inmutable**. Si una decisión cambia, se crea un ADR nuevo
  que **supera** (supersedes) al anterior; no se edita el original.
- Numeración correlativa `NNNN-titulo-en-kebab-case.md`.
- Estados posibles: `Propuesto`, `Aceptado`, `Superado por ADR-XXXX`, `Rechazado`.

## Índice

| ADR                                              | Título                                               | Estado   |
| ------------------------------------------------ | ---------------------------------------------------- | -------- |
| [0001](./0001-arquitectura-por-capas.md)         | Arquitectura por capas dentro de cada feature        | Aceptado |
| [0002](./0002-decision-engine-independiente.md)  | Decision Engine como módulo puro e independiente     | Aceptado |
| [0003](./0003-ia-como-capa-de-interpretacion.md) | La IA es una capa de interpretación, no de ejecución | Aceptado |
| [0004](./0004-estrategia-offline-first.md)       | Estrategia offline-first con cola y LWW              | Aceptado |
| [0005](./0005-multiusuario-desde-el-diseno.md)   | Multiusuario desde el diseño (RLS + user_id)         | Aceptado |
