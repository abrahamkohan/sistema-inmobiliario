# NexoCRM — Manual de Auditoría Completa

> **Propósito:** Antes de salir a vender NexoCRM a un cliente, este manual debe ser ejecutado
> en su totalidad. Si algún ítem falla, el sistema NO está listo para producción.
> Este documento es tu checklist de certificación interna.

---

## CÓMO USAR ESTE MANUAL

1. Creá un archivo `AUDIT_RESULTS.md` y copiá cada checklist
2. Ejecutá cada test manualmente o pasáselo a tu AI de confianza
3. Marcá ✅ PASS, ❌ FAIL, ⚠️ WARN
4. Un solo ❌ en sección CRÍTICA = sistema no apto para venta
5. Repetí la auditoría completa ante cada release major

---

## PARTE 1 — AUTENTICACIÓN Y SESIONES

### 1.1 Login
- [ ] El formulario de login funciona con email + password
- [ ] Credenciales incorrectas muestran mensaje de error claro (no expone si el email existe)
- [ ] Después del login exitoso redirige al dashboard correcto
- [ ] El token JWT se almacena de forma segura (no en `localStorage` expuesto, preferir cookies httpOnly o Supabase maneja esto automáticamente)
- [ ] La sesión persiste al recargar la página
- [ ] La sesión expira correctamente después del tiempo configurado

### 1.2 Logout
- [ ] El botón de logout invalida la sesión en Supabase (`supabase.auth.signOut()`)
- [ ] Después del logout no se puede acceder a rutas protegidas (testeá con F5 o URL directa)
- [ ] El token no queda en memoria ni en storage tras el logout

### 1.3 Recuperación de contraseña
- [ ] "Olvidé mi contraseña" envía email correctamente
- [ ] El link del email lleva a una pantalla de reset funcional
- [ ] El link expira después de usarse una vez
- [ ] La nueva contraseña se guarda y permite login inmediato

### 1.4 Invitación de usuarios
- [ ] Un admin puede invitar a un usuario nuevo
- [ ] El email de invitación llega y el link funciona
- [ ] El usuario invitado puede setear su contraseña
- [ ] Al registrarse, el nuevo usuario tiene el `consultant_id` correcto asignado en `user_roles`
- [ ] El nuevo usuario ve SOLO los datos del tenant (no datos de otros tenants)

### 1.5 Rutas protegidas
- [ ] Sin login, cualquier ruta privada redirige al login
- [ ] No hay rutas privadas accesibles por URL directa sin token válido
- [ ] Las rutas de admin no son accesibles por usuarios con rol `agente`

**SQL de verificación:**
```sql
-- Ver usuarios y sus roles
SELECT u.email, ur.role, ur.is_owner, ur.consultant_id
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY ur.role;

-- Verificar que current_consultant_id() funciona
SELECT current_consultant_id();
```

---

## PARTE 2 — SEGURIDAD RLS (ROW LEVEL SECURITY)

> Esta es la sección MÁS CRÍTICA. Un fallo aquí expone datos de un tenant a otro.

### 2.1 Checklist por tabla

Para CADA tabla, verificá en el **Dashboard de Supabase → Authentication → Policies**:

#### Template de verificación por tabla:
```
Tabla: [nombre_tabla]
RLS habilitado: ✅/❌
SELECT authenticated: ✅/❌ — condición: [consultant_id = current_consultant_id()]
INSERT authenticated: ✅/❌ — WITH CHECK correcto: ✅/❌
UPDATE authenticated: ✅/❌ — USING + WITH CHECK correctos: ✅/❌
DELETE authenticated: ✅/❌ — restricción admin si aplica: ✅/❌
```

#### Tablas a auditar:

**Tier 1 — Críticas (datos de negocio)**
- [ ] `clients`
- [ ] `properties`
- [ ] `projects`
- [ ] `tasks`
- [ ] `notes`
- [ ] `commissions`

**Tier 2 — Relacionadas (sin consultant_id propio — deben hacer JOIN)**
- [ ] `property_photos` → join a `properties`
- [ ] `project_photos` → join a `projects`
- [ ] `project_amenities` → join a `projects`
- [ ] `project_amenity_images` → join a `project_amenities` → `projects`
- [ ] `typologies` → join a `projects`

**Tier 3 — Sistema**
- [ ] `user_roles`
- [ ] `profiles`
- [ ] `consultants`
- [ ] `push_subscriptions`

**Tier 4 — Públicas (anon read necesario para landing)**
- [ ] `projects` — anon SELECT solo campos públicos ✅
- [ ] `typologies` — anon SELECT ✅
- [ ] `project_amenities` — anon SELECT ✅
- [ ] `project_amenity_images` — anon SELECT ✅
- [ ] `properties` — anon SELECT solo `publicado_en_web = true` ✅

### 2.2 Test de aislamiento multi-tenant (CRÍTICO)

Este test requiere DOS tenants configurados en el sistema:

```
Tenant A: consultant_id = UUID_A
Tenant B: consultant_id = UUID_B
```

Con un usuario del Tenant A logueado:
- [ ] `SELECT * FROM clients` — devuelve SOLO clientes de Tenant A (0 de B)
- [ ] `SELECT * FROM properties` — devuelve SOLO propiedades de Tenant A
- [ ] `INSERT INTO clients (...)` — el `consultant_id` se setea a UUID_A automáticamente
- [ ] Intentar hacer UPDATE a un registro de Tenant B — devuelve error o 0 rows
- [ ] Intentar hacer DELETE a un registro de Tenant B — devuelve error o 0 rows

**SQL para el test (ejecutar como cada usuario):**
```sql
-- Debe devolver SOLO registros del tenant del usuario actual
SELECT count(*) FROM clients WHERE consultant_id != current_consultant_id();
-- Resultado esperado: 0

SELECT count(*) FROM properties WHERE consultant_id != current_consultant_id();
-- Resultado esperado: 0
```

### 2.3 Test de roles dentro del tenant

Con un usuario `agente` logueado:
- [ ] Puede ver clientes asignados a él
- [ ] NO puede ver clientes asignados a otros agentes (si aplica la política)
- [ ] NO puede eliminar registros (si DELETE requiere `is_current_user_admin()`)
- [ ] NO puede acceder a rutas de administración del tenant

Con un usuario `admin` logueado:
- [ ] Puede ver TODO dentro del tenant
- [ ] Puede eliminar registros
- [ ] Puede gestionar usuarios del tenant
- [ ] NO puede ver datos de otros tenants

### 2.4 Verificación de la función `current_consultant_id()`

```sql
-- Debe devolver el consultant_id del usuario logueado
SELECT current_consultant_id();

-- Verificar que la función tiene fallback a user_roles
-- (importante para usuarios cuyo JWT no tiene el claim seteado)
\sf current_consultant_id
```

Resultado esperado de la función:
```sql
CREATE OR REPLACE FUNCTION current_consultant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(TRIM(auth.jwt() -> 'user_metadata' ->> 'consultant_id'), '')::UUID,
    (SELECT consultant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

---

## PARTE 3 — SEGURIDAD FRONTEND Y CORS

### 3.1 Variables de entorno

- [ ] `.env` NO está commiteado al repositorio (verificar `.gitignore`)
- [ ] `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` son las únicas keys en el cliente
- [ ] La `service_role` key de Supabase NUNCA aparece en código frontend
- [ ] No hay hardcodeo de UUIDs, passwords, o tokens en el código fuente

```bash
# Verificar que no hay secrets commiteados
git log --all --full-history -- "*.env"
grep -r "service_role" src/
grep -r "eyJhbGci" src/  # busca JWTs hardcodeados
```

### 3.2 CORS y Supabase

En Supabase Dashboard → Settings → API:
- [ ] `CORS allowed origins` incluye SOLO tu dominio de producción (no `*`)
- [ ] En desarrollo: `localhost:5173` (o tu puerto) está en la lista
- [ ] El dominio de staging/preview está separado del de producción

### 3.3 Storage security

Para cada bucket en Supabase Storage:
- [ ] Bucket `property-photos` — privado, RLS habilitado
- [ ] Bucket `project-media` — privado, RLS habilitado
- [ ] Los archivos públicos se sirven via `getPublicUrl()` (que es read-only)
- [ ] No hay buckets en modo "public" sin policy de escritura
- [ ] Un usuario del Tenant A no puede leer archivos del Tenant B

### 3.4 Exposición de datos en el cliente

- [ ] El listado de propiedades NO expone campos sensibles que no deben verse
- [ ] Las respuestas de Supabase no incluyen `consultant_id` de otros tenants
- [ ] No hay console.log con datos de usuario en producción
- [ ] El modo debug / devtools está deshabilitado en el build de producción

---

## PARTE 4 — MÓDULOS FUNCIONALES

### Template de auditoría por módulo

Para cada módulo, ejecutar este flujo completo:

```
MÓDULO: [Nombre]
TABLAS: [tablas involucradas]
RUTAS: [/ruta-crear, /ruta-editar/:id, /ruta-detalle/:id]

TEST 1 — CREAR (INSERT)
  a) Ir a la ruta de nuevo registro
  b) Dejar TODOS los campos vacíos → presionar Guardar
     Esperado: errores de validación visibles en pantalla
  c) Completar solo campos requeridos → presionar Guardar
     Esperado: registro creado, redirect o mensaje de éxito
  d) Completar TODOS los campos → presionar Guardar
     Esperado: todos los campos se guardan correctamente en DB

TEST 2 — LEER (SELECT)
  a) El listado muestra los registros creados
  b) El detalle/ficha muestra todos los campos correctamente
  c) La paginación o scroll infinito funciona (si aplica)

TEST 3 — EDITAR (UPDATE)
  a) Ir al formulario de edición
  b) Verificar que TODOS los campos del create están en el edit
  c) Modificar CADA campo y guardar
  d) Recargar la página → los cambios persisten
  e) Verificar que el botón Guardar NO guarda si hay errores de validación

TEST 4 — ELIMINAR (DELETE)
  a) Eliminar un registro → desaparece de la lista
  b) Intentar acceder por URL directa al registro eliminado → 404 o redirect
  c) Los archivos relacionados (fotos) también se eliminan del storage

TEST 5 — PERMISOS
  a) Agente: ¿puede ver? ¿puede editar? ¿puede eliminar? (según política)
  b) Admin: ¿puede hacer todo?
  c) Usuario de otro tenant: no puede ver ni modificar nada
```

### 4.1 Módulo: PROPIEDADES

- [ ] TEST 1a — Validación al crear (campos requeridos marcados)
- [ ] TEST 1b — Crear propiedad mínima (tipo + operacion)
- [ ] TEST 1c — Crear propiedad completa (todos los campos)
- [ ] TEST 1d — Precio muestra formato correcto (USD vs Gs.)
- [ ] TEST 2a — Listado muestra portada y datos básicos
- [ ] TEST 2b — Ficha muestra todos los campos y galería
- [ ] TEST 3a — Editar carga todos los valores actuales
- [ ] TEST 3b — Drag & drop de fotos funciona y persiste orden
- [ ] TEST 3c — Cambiar foto de portada funciona
- [ ] TEST 3d — Subir fotos por paste (Ctrl+V) funciona
- [ ] TEST 4a — Eliminar propiedad elimina también las fotos del storage
- [ ] TEST 5 — Agente solo ve sus propiedades asignadas (si aplica política)
- [ ] Moneda: USD muestra `USD 135.000`, PYG muestra `Gs. 2.500.000`
- [ ] Estado `publicado_en_web` controla visibilidad en frontend público

### 4.2 Módulo: PROYECTOS

- [ ] TEST 1 — Crear proyecto con nombre y estado
- [ ] TEST 2 — Listado y ficha cargan correctamente
- [ ] TEST 3 — Editar todos los campos del proyecto
- [ ] TEST 3b — Fotos del proyecto: subir, reordenar, eliminar
- [ ] TEST 3c — Links (YouTube, etc.) se guardan correctamente
- [ ] TEST 4 — Eliminar proyecto
- [ ] Amenities: toggle agrega/elimina inmediatamente ✅
- [ ] Amenities: editar nombre/ícono guarda en blur ✅
- [ ] Amenities: "Los cambios se guardan automáticamente" visible ✅
- [ ] Amenities: subir imagen por file y por paste ✅
- [ ] Tipologías: crear nueva tipología ✅
- [ ] Tipologías: editar con lápiz y guardar ✅
- [ ] Tipologías: subir plano y galería ✅
- [ ] Tipologías: eliminar ✅

### 4.3 Módulo: CLIENTES

- [ ] TEST 1 — Crear cliente con todos los campos
- [ ] TEST 2 — Búsqueda y filtros funcionan
- [ ] TEST 3 — Editar datos del cliente
- [ ] TEST 3b — Cambiar agente asignado
- [ ] TEST 3c — Agregar nota al cliente
- [ ] TEST 4 — Eliminar cliente
- [ ] TEST 5 — Agente solo ve clientes asignados a él
- [ ] Estados del lead (nuevo, contactado, etc.) funcionan

### 4.4 Módulo: TAREAS

- [ ] Crear tarea con fecha y asignado
- [ ] Marcar tarea como completada
- [ ] Editar tarea
- [ ] Eliminar tarea
- [ ] Notificación de tarea vencida (si está implementado)
- [ ] Agente solo ve sus tareas

### 4.5 Módulo: NOTAS

- [ ] Crear nota
- [ ] Editar nota
- [ ] Eliminar nota
- [ ] Notas están asociadas al cliente/propiedad/proyecto correcto

### 4.6 Módulo: COMISIONES

- [ ] Crear comisión vinculada a una venta
- [ ] Editar comisión
- [ ] Eliminar comisión
- [ ] Los splits de comisión suman 100%
- [ ] Solo admin puede gestionar comisiones (si aplica)

### 4.7 Módulo: SIMULADOR / FLIP

- [ ] Los cálculos son matemáticamente correctos
- [ ] Los resultados no se guardan en cache de otro usuario
- [ ] Si genera PDF, el PDF es correcto

### 4.8 Módulo: USER ROLES / PERMISOS

- [ ] Admin puede invitar usuarios
- [ ] Admin puede cambiar el rol de un usuario
- [ ] Admin puede desactivar un usuario
- [ ] Un usuario desactivado no puede loguear
- [ ] Los permisos granulares funcionan (si existen)
- [ ] El owner (is_owner=true) tiene acceso total

---

## PARTE 5 — CALIDAD DE CÓDIGO

### 5.1 Código muerto / sin uso

```bash
# Buscar imports sin usar (TypeScript)
npx tsc --noEmit 2>&1 | grep "is declared but"

# Buscar archivos que no son importados por nadie
# (herramienta: ts-prune, knip)
npx knip

# Buscar console.log en producción
grep -rn "console.log" src/ --include="*.tsx" --include="*.ts"

# Buscar TODO y FIXME pendientes
grep -rn "TODO\|FIXME\|HACK\|XXX" src/
```

### 5.2 Consistencia de formularios (CRÍTICO para UX)

Para CADA par de formularios CREAR / EDITAR:
- [ ] Los mismos campos están presentes en ambos
- [ ] Los mismos validadores aplican en ambos
- [ ] Los mismos schemas Zod se usan en ambos
- [ ] El estado inicial del form de edición carga todos los valores de la DB
- [ ] El form de edición tiene todos los campos del form de creación

Verificación rápida con AI:
```
Revisá los siguientes pares de formularios y decime si faltan campos en edit 
que están en create, o viceversa:
- PropiedadCrearPage vs PropiedadEditarPage
- ProyectoFormPage (modo create vs modo edit)
- TypologyForm (defaultValues vs campos del schema)
```

### 5.3 Manejo de errores

- [ ] Todos los `mutateAsync` están dentro de try/catch
- [ ] Todos los errores muestran toast al usuario (no solo console.error)
- [ ] Los errores de validación de Zod son visibles en pantalla
- [ ] Los errores de red/timeout tienen mensaje amigable
- [ ] No hay pantallas en blanco por errores no manejados (Error Boundary)

### 5.4 Performance básica

- [ ] La lista principal de propiedades carga en < 2 segundos
- [ ] No hay queries N+1 (cada item del listado no hace una query extra)
- [ ] Las imágenes usan lazy loading
- [ ] El bundle de producción está minificado (`npm run build` sin errores)

---

## PARTE 6 — BUILD Y DEPLOY

### 6.1 Build limpio

```bash
npm run build
# Esperado: 0 errores, 0 warnings críticos

npm run type-check  # o: npx tsc --noEmit
# Esperado: 0 errores de TypeScript
```

### 6.2 Variables de entorno de producción

- [ ] `.env.production` tiene las URLs y keys correctas
- [ ] Las keys de producción son DISTINTAS a las de desarrollo
- [ ] El proyecto de Supabase de producción tiene RLS habilitado
- [ ] No se usa la misma DB de desarrollo para producción

### 6.3 Deploy checklist

- [ ] El dominio de producción está en CORS de Supabase
- [ ] Los redirects de auth (email confirmation, password reset) apuntan al dominio correcto
- [ ] Los buckets de storage tienen las policies correctas en producción
- [ ] El `supabase db push` fue ejecutado en el proyecto de producción (o las migrations fueron aplicadas manualmente)

---

## RESUMEN DE CRITICIDAD

| Nivel | Descripción | Bloquea venta |
|-------|-------------|---------------|
| 🔴 CRÍTICO | Falla de seguridad, datos de un tenant visibles a otro, login roto | SÍ |
| 🟠 ALTO | Formulario de edición no guarda, módulo principal no funciona | SÍ |
| 🟡 MEDIO | Feature secundaria rota, mensaje de error poco claro | NO (con disclosure) |
| 🟢 BAJO | UI inconsistente, texto mal redactado | NO |

---

*Versión: 1.0 — Actualizar con cada release major*
