# 01 · Visión y alcance

## El problema

Una persona que quiere mejorar su vida física y personal usa hoy varias apps
inconexas: una para el gimnasio, otra para contar calorías, otra para hábitos,
notas para estudiar, otra para el sueño. Ninguna se habla con las demás y
**ninguna reacciona cuando la vida real interfiere**: si te saltas un
entrenamiento, si un día tienes menos horas para estudiar, si te pasas del
presupuesto de comida, cada app sigue como si nada.

El resultado es fricción, datos fragmentados y decisiones que el usuario debe
tomar solo, sin contexto.

## La propuesta de valor

Nexus unifica esos dominios en un **sistema operativo personal** con una capa de
inteligencia por encima. Su diferenciador no es registrar datos, sino:

1. **Recalcular el día.** Si el usuario falla o cambia algo (se salta un
   entrenamiento, reduce sus horas de estudio, se acuesta tarde), Nexus
   reorganiza el resto del día/semana de forma coherente.
2. **Nutrición económica.** Sugiere cambios de comidas que cumplen los objetivos
   de macros **respetando un presupuesto**. Comer bien sin gastar de más.
3. **Rutinas alternativas.** Si no hay tiempo, equipo o el usuario está fatigado,
   propone una rutina de gimnasio alternativa equivalente.

En todos los casos: **Nexus recomienda, el usuario decide.** Las recomendaciones
siempre explican su motivo y los datos que usaron.

## Usuario objetivo

- **v1 (ahora):** una sola persona (el propietario del proyecto). Con
  conocimientos técnicos, exigente con la calidad y la mantenibilidad.
- **Evolución (diseñada, no construida):** múltiples usuarios, modo familiar,
  entrenador, nutricionista, panel administrativo. Ninguna decisión de la v1
  puede bloquear esta evolución (ver [ADR-0005](./adr/0005-multiusuario-desde-el-diseno.md)).

## Dominios del sistema

Cada dominio es una **feature** independiente (ver [arquitectura](./02-arquitectura.md)).

| Dominio       | Qué gestiona                                  | Señales que aporta al motor              |
| ------------- | --------------------------------------------- | ---------------------------------------- |
| **Today**     | Cómo va el día, con acciones rápidas          | — (consume del resto)                    |
| **Dashboard** | KPIs, gráficas y comparativas por periodo     | — (lee y agrega)                         |
| **Planning**  | Plan diario adaptativo, recálculo             | Estado de cumplimiento del día           |
| **Finance**   | Gastos, ingresos, fijos, deudas, topes        | Presupuesto disponible                   |
| **Workout**   | Rutinas, ejercicios, sesiones, historial      | Volumen, frecuencia, fatiga, adherencia  |
| **Nutrition** | Comidas, agua, macros, precio por porción     | Calorías, macros, hidratación            |
| **Habits**    | Hábitos, rachas, calendario                   | Adherencia, rachas activas               |
| **Study**     | Materias, sesiones, bloques (horas variables) | Horas de foco, cumplimiento de objetivos |
| **Sleep**     | Registro y calidad del sueño                  | Duración, calidad, regularidad           |
| **Health**    | Peso, medidas, IMC                            | Tendencia de peso/composición            |
| **Settings**  | Cuenta, tema e instalación                    | —                                        |

> **Lo que esta tabla ya no lista, y por qué.** _Assistant_ (la capa de IA) no
> tiene pantalla: era un cascarón que anunciaba lo que no existía y se retiró
> ([ADR-0003](./adr/0003-ia-como-capa-de-interpretacion.md)). Los **objetivos**
> no viven en Ajustes sino donde se usan —las calorías en nutrición, las horas en
> sueño, los minutos por materia en estudio—, y las **notificaciones** están
> aplazadas ([ADR-0008](./adr/0008-notificaciones-aplazadas.md)). Las **fotos de
> progreso** de salud se descartaron. El **dinero sólo se cuenta en Finanzas**:
> nutrición usa el precio por porción para decidir qué comer, nunca para
> totalizar.

## Características adaptativas (el corazón del producto)

Estas tres capacidades justifican la existencia del [Decision Engine](./06-decision-engine-e-ia.md):

### 1. Recálculo del día

Cuando cambia el estado real (una tarea se marca `skipped`, se registra menos
sueño del objetivo, etc.), el motor reevalúa el `daily_plan` y re-prioriza o
reprograma los `plan_items` restantes según reglas (energía disponible, tiempo
libre, prioridad del dominio, objetivos de la semana).

### 2. Cambio de comidas dentro del presupuesto

El motor conoce los objetivos de macros y el **presupuesto de comida** del
usuario, y el coste por porción de cada alimento. Ante un déficit/exceso o una
petición explícita, propone sustituciones que mantienen los macros y minimizan el
coste.

### 3. Rutina alternativa

Ante restricción de tiempo, equipo disponible o fatiga acumulada, el motor
selecciona ejercicios equivalentes (mismo grupo muscular, distinto equipo o menor
volumen) para generar una sesión alternativa válida.

## Alcance de la v1 (Release 1.0)

**Incluye:** los dominios anteriores en su forma esencial, autenticación,
Decision Engine con las tres reglas descritas, offline-first en el registro de
datos y PWA instalable. El detalle por sprint está en el
[roadmap](./09-roadmap-y-sprints.md).

**No incluye la capa de IA.** Necesita una función de servidor y la clave de un
proveedor, y la aplicación funciona entera sin ella: el motor da sus
recomendaciones por reglas y la IA sólo las explicaría
([ADR-0003](./adr/0003-ia-como-capa-de-interpretacion.md)).

## Fuera de alcance (No-Goals) de la v1

Se descartan **explícitamente** para no comprometer calidad ni tiempo, aunque la
arquitectura no los bloquea:

- Multiusuario real, roles (entrenador/nutricionista) y modo familiar.
- Integración con wearables (Apple Health, Google Fit, Garmin…).
- Sincronización en tiempo real entre dispositivos (más allá del offline-sync).
- IA que **ejecute** acciones automáticamente (siempre requiere confirmación).
- Marketplace de rutinas/dietas o contenido social.
- App nativa iOS/Android (se cubre con PWA).

## Glosario

| Término                 | Definición                                                                       |
| ----------------------- | -------------------------------------------------------------------------------- |
| **Feature**             | Módulo de dominio autónomo (workout, nutrition…).                                |
| **Decision Engine**     | Motor de reglas puro que produce recomendaciones. No tiene UI ni accede a la BD. |
| **Recomendación**       | Salida del motor: acción sugerida con motivo y datos.                            |
| **Daily Plan**          | Plan del día compuesto por `plan_items` de varios dominios.                      |
| **Snapshot / Contexto** | Foto normalizada de los datos del usuario que se entrega al motor.               |
| **Repository**          | Capa que sólo habla con Supabase (lee/escribe datos).                            |
| **Service**             | Capa con las reglas de negocio de una feature.                                   |
| **Macros**              | Proteínas, carbohidratos y grasas.                                               |
| **RLS**                 | Row Level Security de PostgreSQL.                                                |
