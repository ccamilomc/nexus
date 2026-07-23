# 12 · Seguridad

Principio rector: **toda la información pertenece únicamente al usuario
autenticado** y **nunca se confía sólo en el frontend**. Toda operación crítica se
valida también en el backend.

## Modelo de amenaza (v1)

- App de un solo usuario en su navegador, datos personales de salud/hábitos.
- Riesgos principales: acceso a datos de otro usuario (multiusuario futuro),
  filtración de secretos (API keys), XSS, y pérdida/corrupción de datos en sync.
- Mitigaciones: RLS estricta, secretos sólo en servidor, validación doble,
  sanitización, y diseño de sincronización con conflictos resueltos.

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
- **Verificación obligatoria** en el Sprint 3: probar que un usuario B no puede
  leer ni escribir datos del usuario A.

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
