# 🚀 ROADMAP SaaS — Sistema Inmobiliario

> Documento estratégico y técnico para transformar el CRM en un producto SaaS multi-tenant.

---

## 📅 Fecha: 2026-04-06
## 🎯 Estado: Planificación completa — Listo para ejecutar

---

# 🧠 1. ESTADO ACTUAL (HOY)

## Lo que YA tenés implementado

| Componente | Estado | Detalle |
|------------|--------|---------|
| Multi-tenant routing | ✅ | Subdominios via HostContext |
| Brand dinámico | ✅ | BrandContext + BrandLoader |
| consultants table | ✅ | Con subdomain, custom_domain, activo |
| consultant_id en tablas | ✅ | clients, properties, projects, tasks, notes |
| RLS por tenant | ✅ | current_consultant_id() en todas las policies |
| Trigger auto-populate | ✅ | consultant_id se asigna automáticamente |
| Roles | ✅ | admin + agente (falta super_admin) |

## Lo que NO tenés

| Componente | Estado |
|------------|--------|
| Rol super_admin | ❌ Falta |
| RLS bypass para super_admin | ❌ Falta |
| Onboarding interno | ❌ Falta |
| Admin panel | ❌ Falta |
| Facturación | ❌ Falta |

## Conclusión

> **Ya tenés el 60% del SaaS hecho.** No estás empezando de cero. Solo falta cerrar la capa operativa.

---

# 🗺️ 2. ROADMAP GENERAL

```
FASE 1: Super Admin + RLS    ──→ ✅ Cerrar arquitectura
FASE 2: Onboarding           ──→ ✅ Crear clientes sin tocar DB
FASE 3: Admin Panel          ──→ ✅ Ver y gestionar tenants
FASE 4: Facturación          ──→ ✅ Cobrar por uso
FASE 5: Dominios Custom      ──→ ✅ Profesionalizar (opcional)
FASE 6: Mejoras SaaS         ──→ ✅ Escalar
```

---

# 🧱 3. FASE 1 — SUPER_ADMIN + RLS (CRÍTICO)

## Objetivo

Que el super_admin (vos) pueda ver y gestionar TODOS los tenants sin que se rompa el aislamiento para admins normales.

## Lo que hace

- Agrega rol `super_admin` al constraint
- Crea función helper `is_super_admin()`
- Actualiza RLS para permitir bypass controlado
- Habilita UPDATE + DELETE (no solo SELECT)

## Tablas que necesitan bypass

| Tabla | Bypass | Por qué |
|-------|--------|---------|
| clients | ✅ | Ver todos los clientes |
| properties | ✅ | Ver todas las propiedades |
| projects | ✅ | Ver todos los proyectos |
| tasks | ✅ | Ver todas las tareas |
| notes | ✅ | Ver todas las notas |
| user_roles | ✅ | Gestionar roles cross-tenant |
| consultants | ✅ | Ver todos los tenants |

## ⚠️ Punto crítico: uuid vs id

- `current_consultant_id()` retorna **UUID**
- `consultants.id` es **integer**
- `consultants.uuid` es **UUID**
- **Usar `uuid` en la política de consultants, NO `id`**

## Script SQL completo

```sql
-- ============================================================
-- FASE 1: SUPER_ADMIN + RLS BYPASS
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Constraint super_admin
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('super_admin', 'admin', 'agente'));

-- 2. Función helper
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. RLS — clients (SELECT + UPDATE + DELETE)
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin())
  WITH CHECK (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE TO authenticated
  USING ((consultant_id = current_consultant_id() AND is_current_user_admin()) OR is_super_admin());

-- 4. RLS — properties (SELECT + UPDATE + DELETE)
DROP POLICY IF EXISTS "properties_select" ON public.properties;
CREATE POLICY "properties_select" ON public.properties
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "properties_update" ON public.properties;
CREATE POLICY "properties_update" ON public.properties
  FOR UPDATE TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin())
  WITH CHECK (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "properties_delete" ON public.properties;
CREATE POLICY "properties_delete" ON public.properties
  FOR DELETE TO authenticated
  USING ((consultant_id = current_consultant_id() AND is_current_user_admin()) OR is_super_admin());

-- 5. RLS — projects (SELECT + UPDATE + DELETE)
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin())
  WITH CHECK (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated
  USING ((consultant_id = current_consultant_id() AND is_current_user_admin()) OR is_super_admin());

-- 6. RLS — tasks (SELECT + UPDATE + DELETE)
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin())
  WITH CHECK (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin());

-- 7. RLS — notes (SELECT + UPDATE + DELETE)
DROP POLICY IF EXISTS "notes_select" ON public.notes;
CREATE POLICY "notes_select" ON public.notes
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "notes_update" ON public.notes;
CREATE POLICY "notes_update" ON public.notes
  FOR UPDATE TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin())
  WITH CHECK (consultant_id = current_consultant_id() OR is_super_admin());

DROP POLICY IF EXISTS "notes_delete" ON public.notes;
CREATE POLICY "notes_delete" ON public.notes
  FOR DELETE TO authenticated
  USING (consultant_id = current_consultant_id() OR is_super_admin());

-- 8. RLS — user_roles (CRÍTICO)
DROP POLICY IF EXISTS "self_read_role" ON public.user_roles;
CREATE POLICY "self_read_role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "admins_update_roles" ON public.user_roles;
CREATE POLICY "admins_update_roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    is_super_admin() OR (
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.consultant_id = user_roles.consultant_id
      )
    )
  );

-- 9. RLS — consultants (CRÍTICO - usar uuid, NO id)
DROP POLICY IF EXISTS "Solo admins ven config" ON public.consultants;
CREATE POLICY "consultants_select" ON public.consultants
  FOR SELECT TO authenticated
  USING (is_super_admin() OR uuid = current_consultant_id());

-- 10. Promover usuario a super_admin
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'TU_EMAIL_AQUI'
);
```

## TypeScript changes

```typescript
// src/types/database.ts — user_roles Row
{
  user_id: string
  consultant_id: string  // <-- agregar si no está
  role: 'super_admin' | 'admin' | 'agente'  // <-- agregar 'super_admin'
  permisos: Record<string, any> | null
}
```

---

# 🧱 4. FASE 2 — ONBOARDING INTERNO

## Objetivo

Crear un cliente nuevo en 30 segundos sin tocar DB manualmente.

## Flujo

```
CLIENTE PAGA
    │
    ├─ 1. Entrás a tu sistema → /admin/onboarding
    │
    ├─ 2. Completás formulario:
    │      • Nombre inmobiliaria
    │      • Email del admin
    │      • Logo (URL o subido)
    │      • Colores
    │
    ├─ 3. Click "Crear"
    │
    ├─ 4. El sistema hace automáticamente:
    │      • INSERT consultants → crea el tenant
    │      • Genera link de invite → le llega email al admin
    │      • Crea user_roles → vincula usuario + consultant
    │
    └─ 5. El cliente abre el email → entra al sistema → listo
```

## Componentes a crear

| Archivo | Qué hace |
|---------|----------|
| `src/pages/OnboardingPage.tsx` | Formulario de creación |
| `src/components/auth/RequireSuperAdmin.tsx` | Protección de ruta |
| `src/lib/onboarding.ts` | Lógica de creación |
| `src/router.tsx` | Agregar ruta /admin/onboarding |

## Formulario

Campos:
- `nombre` (texto)
- `email_admin` (email)
- `logo_url` (URL)
- `color_primary` (color picker)
- `color_secondary` (color picker)
- `subdomain` (texto, auto-generado del nombre)

## Lógica del submit

```
1. INSERT consultants → obtengo consultant_id
2. supabase.auth.admin.inviteUserByEmail() → crea el usuario
3. INSERT user_roles → vincula user_id + consultant_id + role='admin'
4. Actualizar brand_config si aplica
```

## Nota técnica

Para usar `auth.admin.inviteUserByEmail()` se necesita el **service_role key** de Supabase, que NO puede estar en el frontend.

**Solución:** Supabase Edge Function `onboard-consultant` que:
- Recibe los datos del formulario
- Crea el consultant
- Invita al usuario
- Crea el user_roles
- Retorna success/error

---

# 🧱 5. FASE 3 — ADMIN PANEL

## Objetivo

Ver y gestionar todos tus clientes desde un solo lugar.

## Ruta

`/admin/consultants` (protegida por super_admin)

## Pantalla principal

```
┌──────────────────────────────────────────────────────────┐
│ 📋 CONSULTANTS                                           │
├──────────────────┬────────┬────────┬────────┬───────────┤
│ Nombre           │ Users  │ Status │ Pagado │ Acción    │
├──────────────────┼────────┼────────┼────────┼───────────┤
│ Inmobiliaria X   │ 3      │ ✅     │ ✅     │ [Ver]     │
│ Real Estate Y    │ 1      │ ✅     │ ❌     │ [Ver]     │
│ Propiedades Z    │ 5      │ ❌     │ ❌     │ [Ver]     │
└──────────────────┴────────┴────────┴────────┴───────────┘
```

## Vista por cliente

```
┌──────────────────────────────────────────────────────────┐
│ 👤 INMOBILIARIA X                                        │
├──────────────────────────────────────────────────────────┤
│ Nombre: Inmobiliaria X                                   │
│ Subdominio: inmobiliaria-x.tuapp.com                     │
│ Admin: admin@inmobiliaria-x.com                          │
│ Status: ✅ Activo                                        │
├──────────────────────────────────────────────────────────┤
│ 👥 USUARIOS (3)                                          │
│  • admin@inmobiliaria-x.com (admin)                      │
│  • agente1@inmobiliaria-x.com (agente)                   │
│  • agente2@inmobiliaria-x.com (agente)                   │
├──────────────────────────────────────────────────────────┤
│ 🎨 BRANDING                                              │
│  Logo: [imagen]                                          │
│  Colores: #4A90D9, #1E3A5F, #C9A34E                      │
├──────────────────────────────────────────────────────────┤
│ [✏️ Editar] [⏸️ Desactivar] [🗑️ Eliminar]              │
└──────────────────────────────────────────────────────────┘
```

## Componentes a crear

| Archivo | Qué hace |
|---------|----------|
| `src/pages/admin/ConsultantsPage.tsx` | Lista de tenants |
| `src/pages/admin/ConsultantDetailPage.tsx` | Vista detalle |
| `src/hooks/useConsultants.ts` | Query de consultants |
| `src/hooks/useConsultantUsers.ts` | Query de usuarios por tenant |

---

# 🧱 6. FASE 4 — FACTURACIÓN

## Objetivo

Cobrar por el uso del sistema.

## Campos a agregar en consultants

```sql
ALTER TABLE consultants ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE consultants ADD COLUMN paid_until TIMESTAMPTZ;
ALTER TABLE consultants ADD COLUMN status TEXT DEFAULT 'active';
```

## Planes (ejemplo)

| Plan | Precio | Usuarios | Propiedades |
|------|--------|----------|-------------|
| Free | $0 | 1 | 10 |
| Básico | $20/mes | 3 | 100 |
| Pro | $50/mes | 10 | ∞ |

## Integración

| Servicio | Opción |
|----------|--------|
| MercadoPago | Común en LatAm |
| Stripe | Internacional |

## Lógica

- Si `paid_until < NOW()` → mostrar aviso
- Si `status = 'suspended'` → bloquear acceso
- Renovación manual o automática

---

# 🧱 7. FASE 5 — DOMINIOS CUSTOM (OPCIONAL)

## Objetivo

Que el cliente use su propio dominio.

## Ejemplo

- `tuapp.com` → sistema base
- `cliente.com` → mismo sistema, distinto tenant

## Qué implica

| Item | Dificultad |
|------|------------|
| Configuración en Vercel | Media |
| DNS propagation (48h) | Lento |
| SSL automático | Media |
| Guía para cliente | Necesaria |

## Recomendación

**NO implementar todavía.** Arrancar solo con subdominios:
- `inmobiliaria-x.tuapp.com`

Implementar dominios custom cuando tengas 10+ clientes.

---

# 🧱 8. FASE 6 — MEJORAS SaaS

## Objetivo

Escalar el negocio.

## Items

| Item | Prioridad |
|------|-----------|
| Landing page de venta | Alta |
| Documentación de usuario | Media |
| Soporte automatizado | Baja |
| API pública | Baja |
| Integraciones (WhatsApp, etc.) | Futuro |

---

# 📊 9. ESCALABILIDAD

## Cuándo hacer qué

| Clientes | Qué hacer |
|----------|-----------|
| 1-5 | Todo manual, un repo |
| 5-10 | Admin panel básico |
| 10-20 | Edge Functions automáticas |
| 20-50 | Facturación automática |
| 50+ | API pública, integraciones |

## Modelo de infraestructura

| ❌ NO hacer | ✅ SÍ hacer |
|-------------|-------------|
| Gmail por cliente | Tu Gmail único |
| GitHub por cliente | Tu GitHub único |
| Supabase por cliente | Tu Supabase único |
| Vercel por cliente | Tu Vercel único |

**Todo vive en TU cuenta. El CRM separa por `consultant_id`.**

---

# 🎯 10. ORDEN DE EJECUCIÓN

```
1. Ejecutar SQL de Fase 1 (super_admin + RLS)
2. Actualizar TypeScript types
3. Testear que super_admin funciona
4. Crear Edge Function de onboarding
5. Crear página /admin/onboarding
6. Testear onboarding con cliente de prueba
7. Crear página /admin/consultants
8. Agregar campos de facturación
9. Integrar pagos
10. Dominios custom (opcional)
```

---

# 📝 11. NOTAS TÉCNICAS

## Funciones SQL existentes

| Función | Qué hace |
|---------|----------|
| `current_consultant_id()` | Retorna UUID del consultant del usuario actual |
| `is_current_user_admin()` | Retorna boolean si el usuario es admin |
| `is_super_admin()` | **NUEVA** — Retorna boolean si el usuario es super_admin |
| `auto_set_tenant_fields()` | Trigger que asigna consultant_id automáticamente |

## RLS pattern

```sql
-- Patrón estándar
USING (consultant_id = current_consultant_id())

-- Con super_admin bypass
USING (consultant_id = current_consultant_id() OR is_super_admin())

-- Con delete protegido
USING ((consultant_id = current_consultant_id() AND is_current_user_admin()) OR is_super_admin())
```

## Edge Functions necesarias

| Función | Para qué |
|---------|----------|
| `onboard-consultant` | Crear tenant + invitar usuario |

---

# 🧠 12. FRASE FINAL

> "El sistema ya estaba bien diseñado — solo le faltaba la llave maestra."

---

# ✅ 13. CHECKLIST DE EJECUCIÓN

- [ ] Ejecutar SQL Fase 1 en Supabase
- [ ] Actualizar `database.ts` types
- [ ] Testear super_admin access
- [ ] Crear Edge Function `onboard-consultant`
- [ ] Crear `RequireSuperAdmin` component
- [ ] Crear `OnboardingPage`
- [ ] Agregar ruta `/admin/onboarding`
- [ ] Testear onboarding end-to-end
- [ ] Crear `ConsultantsPage`
- [ ] Crear `ConsultantDetailPage`
- [ ] Agregar campos billing en consultants
- [ ] Integrar Stripe/MercadoPago
- [ ] Documentar proceso de venta
