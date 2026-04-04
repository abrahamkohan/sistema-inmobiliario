# PLAN DE MIGRACIÓN A MULTI-TENANT (Opción D)

## Resumen Ejecutivo

Arquitectura: Multi-tenant híbrido  
Objetivo: Una sola DB, una sola app, múltiples clientes (consultoras)  
Estado actual: Single-tenant con `consultora_config` funcionando

---

## 1. TABLAS QUE NECESITAN `consultora_id`

### Tier 1 — CRÍTICAS (datos principales de cada cliente)

| Tabla | Actual tiene consultant_id? | Notas |
|-------|------------------------------|-------|
| `clients` | ❌ NO | Leads y clientes |
| `properties` | ❌ NO | Propiedades |
| `tasks` | ❌ NO | Tareas |
| `projects` | ❌ NO | Proyectos inmobiliarios |
| `notes` | ❌ NO | Notas de clientes |
| `presupuestos` | ❌ NO | Presupuestos |
| `simulations` | ❌ NO | Simulaciones de crédito |

### Tier 2 — IMPORTANTES (operación)

| Tabla | Notas |
|-------|-------|
| `agentes` | Agentes/comerciales |
| `profiles` | Perfiles de usuario |
| `user_roles` | Roles por usuario |
| `commissions` | Ventas/comisiones |
| `commission_splits` | División de comisiones |
| `commission_clients` | Clients de comisiones |
| `commission_incomes` | Ingresos por comisión |

### Tier 3 — OPCIONALES / REVIEW

| Tabla | Tratamiento |
|-------|-------------|
| `flip_calculations` | Templates → Global (sin consultant_id) |
| `assets` | Podría ser global o por cliente |
| `commercial_allies` | Por cliente |
| `consultora_google_tokens` | Por cliente |
| `consultora_google_oauth_states` | Por cliente |
| `push_subscriptions` | Por cliente |

### Tablas QUE NO necesitan consultant_id

- `consultora_config` → ES la tabla de tenants
- `flip_calculations` → Templates globales
- Tablas de auth de Supabase → No tocar

---

## 2. ESTRUCTURA DE MIGRACIÓN SQL

### Paso 1: Agregar consultant_id a las tablas

```sql
-- Agregar consultant_id a tablas principales
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE agentes ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE commission_splits ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE commission_clients ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
ALTER TABLE commission_incomes ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES consultant(id);
```

### Paso 2: Renombrar/crear tabla de tenants

```sql
-- La tabla actual es "consultora_config", la renombramos a "consultants" (o "tenants")
ALTER TABLE consultora_config RENAME TO consultants;

-- Agregar campos necesarios para multi-tenant
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE; -- para multi-tenant
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE; -- dominio propio
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
```

---

## 3. MODIFICACIÓN DE RLS

### Función helper

```sql
-- Función para obtener el consultant_id del usuario actual
CREATE OR REPLACE FUNCTION current_consultant_id()
RETURNS UUID AS $$
  SELECT consultant_id 
  FROM user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

### Políticas RLS actualizadas

```sql
-- Ejemplo para clients
CREATE POLICY "Users can see their consultant's clients" ON clients
  FOR SELECT
  TO authenticated
  USING (consultant_id = current_consultant_id());

CREATE POLICY "Users can insert their consultant's clients" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "Users can update their consultant's clients" ON clients
  FOR UPDATE
  TO authenticated
  USING (consultant_id = current_consultant_id())
  WITH CHECK (consultant_id = current_consultant_id());

-- Repetir para cada tabla
```

### Tablas que quedan GLOBALES (sin consultant_id)

```sql
-- flip_calculations, assets, etc - políticas que permiten SELECT a todos
CREATE POLICY "Authenticated users can view global data" ON flip_calculations
  FOR SELECT TO authenticated USING (true);
```

---

## 4. DETECCIÓN DE CLIENTE POR DOMINIO

### En el Frontend (Vercel/React)

```typescript
// src/lib/tenant.ts
import { supabase } from './supabase'

export async function getCurrentConsultant() {
  // 1. Obtener dominio actual
  const hostname = window.location.hostname
  
  // 2. Buscar por subdomain o custom domain
  const { data: consultant } = await supabase
    .from('consultants')
    .select('*')
    .or(`subdomain.eq.${hostname},custom_domain.eq.${hostname}`)
    .single()
  
  return consultant
}
```

### Middleware de autenticación

```typescript
// src/hooks/useAuth.ts (modificar)
export function useAuth() {
  // ... existing code
  
  // Agregar: verificar consultant_id del usuario
  const consultantId = useMemo(() => {
    if (!session?.user?.id) return null
    // 获取用户的 consultant_id
  }, [session])
  
  return { session, loading, consultantId }
}
```

---

## 5. ADAPTAR CONSULTORA_CONFIG

### Estructura actual (lo que ya tenés):

```sql
-- Tabla: consultants (antes consultora_config)
- id
- nombre
- slogan
- logo_url
- logo_light_url
- favicon_url
- color_primary
- color_secondary
- color_accent
- version
- telefono
- whatsapp
- email
- facebook_url
- instagram_url
- google_calendar_id
- google_calendar_enabled
- simulador_publico
- subdomain (NUEVO)
- custom_domain (NUEVO)
- activo (NUEVO)
```

### Cambios necesarios:

1. La tabla ya existe, rename a `consultants`
2. Agregar `subdomain`, `custom_domain`, `activo`
3. Mantener backwards compatibility con código existente

---

## 6. PARTES DEL CÓDIGO A TOCAR

### Frontend

| Archivo | Qué hacer |
|--------|-----------|
| `src/types/database.ts` | Regenerar tipos (después de migración) |
| `src/lib/consultoraConfig.ts` | Renombrar a `consultant.ts`, usar nueva estructura |
| `src/hooks/useConsultora.ts` | Actualizar nombre de tabla |
| `src/context/BrandContext.tsx` | Leer de `consultants` no `consultora_config` |
| `src/components/layout/Sidebar.tsx` | 可能需要调整 |
| `src/router.tsx` | Agregar detección de tenant |

### Backend (Supabase)

| Archivo | Qué hacer |
|---------|-----------|
| Migraciones SQL | Crear script de migración |
| RLS Policies | Actualizar todas las políticas |

---

## 7. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Preparación (SIN romper)
1. Analizar datos existentes
2. Crear script de migración
3. Testear en staging/local

### Fase 2: Migración de DB
1. Agregar columna `consultant_id` a todas las tablas
2. Popular `consultant_id` con datos existentes (para cliente 1)
3. Crear políticas RLS nuevas

### Fase 3: Migración de Código
1. Renombrar `consultora_config` → `consultants`
2. Actualizar referencias en código
3. Agregar detección por dominio

### Fase 4: Testing
1. Verificar que todo funciona igual
2. Probar que RLS filtra correctamente
3. Verificar que branding carga bien

### Fase 5: Deploy
1. Deploy migraciones a producción
2. Deploy código actualizado
3. Monitorear errores

---

## 8. RIESGOS Y MITIGACIONES

| Riesgo | Mitigación |
|--------|------------|
| Perder datos | Backup antes de migrar |
| Breaking changes | Testear en staging primero |
| Migration lenta | Hacer en off-hours |
| RLS demasiado restrictiva | Test exhaustivo antes de deploy |
| Branding roto | Verificar que consultant_config carga |

---

## 9. SCRIPTS PREPARADOS

Tenemos listos para ejecutar:
- [ ] Script de migración SQL completo
- [ ] Políticas RLS actualizadas
- [ ] Actualización de código

---

## SIGUIENTE ACCIÓN

1. **Confirmá** que este plan te sirve
2. **Decidí** si arrancamos con la migración o si querés agregar algo
3. **Yo implemento** cuando me des el OK

¿Confirmás este plan?
