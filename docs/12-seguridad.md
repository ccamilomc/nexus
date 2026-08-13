# 12 · Seguridad

Principio rector: **toda la información pertenece únicamente al usuario
autenticado** y **nunca se confía sólo en el frontend**. Toda operación crítica se
valida también en el backend.

## Modelo de amenaza (v1)

- App con **dos cuentas**, cada una con su sesión, en sus navegadores; datos
  personales de salud y hábitos. Desde el 2026-08-13 el multiusuario dejó de ser
  hipótesis: son dos personas reales que pueden compartir un ordenador.
- Riesgos principales: acceso a datos de la otra cuenta, filtración de secretos
  (API keys), XSS, y pérdida/corrupción de datos en sync.
- Mitigaciones: RLS estricta, secretos sólo en servidor, validación doble,
  sanitización, y diseño de sincronización con conflictos resueltos.
- **El adversario no es un atacante con el dispositivo en la mano**, sino el
  descuido: que lo de uno se quede a la vista del otro. Eso cambia qué vale la
  pena — cifrar la caché no, saber de quién es sí
  ([ADR-0010](./adr/0010-la-cache-lleva-firmado-su-dueno.md)).

## Lo que se guarda en el dispositivo

La RLS protege el servidor, **no el disco**. La caché de consultas se persiste en
`localStorage` ([ADR-0007](./adr/0007-cache-persistente-en-localstorage.md)) con
datos de salud en claro, así que:

- Se borra al quedarse sin sesión.
- **Lleva firmado su dueño** y se tira si no coincide con quien tiene la sesión,
  en vez de fiarse de haber pasado por «cerrar sesión»
  ([ADR-0010](./adr/0010-la-cache-lleva-firmado-su-dueno.md)).

Comprobado en el navegador: con un dato reconocible dentro de la caché y la firma
cambiada, al recargar el dato desaparece.

## Autenticación

- **Supabase Auth** gestiona sesiones, refresco y proveedores.
- Rutas privadas protegidas en el cliente **y** respaldadas por RLS en la BD (la
  protección de ruta es UX; la de datos es la BD).
- La sesión se persiste de forma segura según la configuración de Supabase; se
  maneja el refresco y la expiración con estados claros.

## Autorización — Row Level Security

- **RLS activada en todas las tablas** desde la primera migración.
- Un usuario sólo accede a filas con su `auth.uid()`; las tablas hijas verifican la
  propiedad a través de su agregado raíz. Plantillas y ejemplos en
  [05 · Base de datos](./05-base-de-datos.md#row-level-security).
- Catálogos globales: lectura pública autenticada; escritura sólo de filas propias.

### Cómo se prueba el aislamiento sin crear una segunda cuenta

No hace falta registrar a nadie: se le pregunta a la base **haciéndose pasar por
otro usuario**, dentro de una transacción que se deshace al terminar. Es más
riguroso que iniciar sesión dos veces, porque prueba la frontera donde de verdad
está —la política— y no el camino que lleva hasta ella.

```sql
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', '<un uuid cualquiera>', 'role', 'authenticated')::text,
    true
  );
  set local role authenticated;   -- sin esto se consulta como postgres, que se salta la RLS

  select count(*) from finance_transactions;   -- debe dar 0
rollback;
```

**El `set local role` es lo que importa.** `supabase db query --linked` entra como
`postgres`, que ignora la RLS: sin cambiar de rol, la prueba sale «bien» siempre y
no demuestra nada.

Resultado del 2026-08-13, con la base sembrada:

| Como…                     | Movimientos | Medidas | Comidas | Alimentos |
| ------------------------- | ----------- | ------- | ------- | --------- |
| `postgres` (salta la RLS) | 130         | 31      | 289     | 33        |
| Otro usuario autenticado  | **0**       | **0**   | **0**   | **15**    |

Los 15 alimentos que sí ve son **los del sistema** (`user_id` nulo); los 18
personales quedan invisibles, que es justo lo que deben hacer los catálogos
compartidos. Igual con ejercicios (13) y categorías de finanzas (15).

Y en escritura, intentando modificar y borrar filas ajenas: **0 movimientos
cambiados, 0 medidas borradas, 0 comidas borradas**. No da error de permisos:
sencillamente no hay ninguna fila que le pertenezca sobre la que actuar.

**Lo que esta prueba no cubre** es el flujo de registro y entrada de la segunda
persona, que es la interfaz de siempre. Para eso sí hace falta una cuenta real.

## Validación en dos capas

1. **Cliente:** Zod valida en formularios y en los services antes de enviar
   (feedback inmediato, buena UX).
2. **Servidor:** las restricciones viven en la BD (tipos, `check`, `not null`,
   `unique`, FKs, enums) y en RLS. Las Edge Functions revalidan su entrada.

Nunca se asume que el cliente actúa correctamente.

## Secretos y variables de entorno

- **Nunca** hay secretos en el código. Se usan archivos `.env` (no versionados) y
  un `.env.example` de plantilla.
- Separación por entorno: **Development / Preview / Production** (Vercel + Supabase).
- Sólo variables con prefijo público (`VITE_`) llegan al cliente, y **jamás**
  contienen secretos: en el cliente sólo va la **anon key** de Supabase (pensada
  para uso público, protegida por RLS) y URLs públicas.
- La **API key del proveedor de IA** y la **service_role key** viven **sólo** en
  Edge Functions / servidor. Nunca en el bundle del cliente.

## Storage

- Bucket **privado** para fotos de progreso; acceso restringido por políticas a la
  carpeta del propio usuario.
- Acceso mediante **URLs firmadas** de vida corta. Nunca URLs públicas permanentes
  de datos personales.

## Datos personales y URLs

- Nunca colocar datos personales o sensibles en query strings o parámetros de URL.
- El derecho al olvido se soporta con `on delete cascade` desde `auth.users`.

## Logging

- Un **punto único** de logging (`core/logger`), preparado para integrar
  Sentry/PostHog en el futuro sin cambiar la estructura.
- Se registran **errores y eventos útiles** (incl. problemas de sincronización).
- **Nunca** se registran: contraseñas, tokens, claves, ni datos personales
  innecesarios. Los mensajes al usuario nunca exponen detalles técnicos.

## Edge Functions

- Validan su entrada, comprueban la sesión del llamante y aplican límites
  razonables (tamaño, frecuencia) donde aplique.
- La función `ai-assistant` es el único punto que conoce la API key del proveedor
  de IA y nunca devuelve secretos al cliente.

## Dependencias

- Política estricta de dependencias
  ([10 · Stack](./10-stack-tecnologico.md#política-de-dependencias)): menos
  superficie = menos riesgo. Auditoría de vulnerabilidades en CI cuando se
  configure (Sprint 16).
