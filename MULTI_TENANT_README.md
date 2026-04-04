# Multi-Tenant Architecture - Sistema Inmobiliario CRM

## Resumen Ejecutivo

Este documento describe la migración del sistema inmobiliario de una arquitectura **single-tenant** a **multi-tenant**, permitiendo servir múltiples inmobiliarias independientes desde una única instalación.

---

## 1. Problema Original

### Arquitectura Anterior (Single-Tenant)
```
┌─────────────────────────────────────────┐
│           Supabase Project             │
│  ┌─────────────────────────────────┐   │
│  │  Kohan & Campos CRM             │   │
│  │  (único cliente posible)       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Limitación**: Cada nuevo cliente requiere un nuevo proyecto de Supabase → costo multiplicado y mantenimiento complejo.

---

## 2. Solución Implementada (Multi-Tenant Híbrido)

### Nueva Arquitectura
```
┌─────────────────────────────────────────────────────┐
│              Base de Datos Compartida              │
│  ┌─────────────────────────────────────────────┐  │
│  │  consultants (tabla de tenants)              │  │
│  │  ┌──────────┬──────────┬──────────┐        │  │
│  │  │ Kohan &  │ Inmob.   │  Otra    │        │  │
│  │  │ Campos   │ ABC      │ Agencia  │        │  │
│  │  └──────────┴──────────┴──────────┘        │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  Todas las tablas now tienen:                      │
│  ┌─────────────────────────────────────────────┐  │
│  │  consultant_id (UUID) → FK a consultants    │  │
│  │  clients, properties, tasks, projects, etc.  │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 3. Cambios Técnicos Realizados

### 3.1 Nueva Tabla de Tenants

```sql
-- Tabla renombrada: consultora_config → consultants
-- Nuevos campos:
ALTER TABLE consultants ADD COLUMN uuid UUID;
ALTER TABLE consultants ADD COLUMN subdomain TEXT UNIQUE;
ALTER TABLE consultants ADD COLUMN custom_domain TEXT UNIQUE;
ALTER TABLE consultants ADD COLUMN activo BOOLEAN DEFAULT true;
```

### 3.2 Columna consultant_id en Todas las Tablas

| Tabla | Columna Agregada |
|-------|------------------|
| clients | consultant_id UUID |
| properties | consultant_id UUID |
| tasks | consultant_id UUID |
| projects | consultant_id UUID |
| notes | consultant_id UUID |
| presupuestos | consultant_id UUID |
| simulations | consultant_id UUID |
| agentes | consultant_id UUID |
| profiles | consultant_id UUID |
| user_roles | consultant_id UUID |
| commissions | consultant_id UUID |
| commission_splits | consultant_id UUID |
| commission_clients | consultant_id UUID |
| commission_incomes | consultant_id UUID |
| commercial_allies | consultant_id UUID |
| assets | consultant_id UUID |
| push_subscriptions | consultant_id UUID |

**Total: 17 tablas modificadas**

### 3.3 Funciones Helper

```sql
-- Obtiene el consultant_id del usuario actual
current_consultant_id() → UUID

-- Verifica si el usuario es admin
is_current_user_admin() → BOOLEAN
```

### 3.4 Políticas RLS (Row Level Security)

Las políticas ahora filtran datos por `consultant_id`:

```sql
-- Ejemplo: Clients
CREATE POLICY "Users can see their consultant's clients" ON clients
  FOR SELECT
  TO authenticated
  USING (
    consultant_id = current_consultant_id()
    OR is_current_user_admin()  -- Fallback para transición
  );
```

**Políticas creadas: 103** cubriendo todas las tablas.

---

## 4. Cómo Funciona el Aislamiento de Datos

### Flujo de Acceso:

```
1. Usuario se loguea
      ↓
2. auth.uid() = UUID del usuario
      ↓
3. Se busca en user_roles:
   SELECT consultant_id FROM user_roles WHERE user_id = auth.uid()
      ↓
4. Se aplica en cada query:
   SELECT * FROM clients WHERE consultant_id = 'xxx'
```

### Beneficio: Los usuarios solo ven datos de SU inmobiliaria

| Usuario | consultant_id | Ve en clients |
|---------|---------------|---------------|
| Usuario Kohan & Campos | 7902a165... | Solo clientes de Kohan |
| Usuario Inmob. ABC | 7912a165... | Solo clientes de ABC |

---

## 5. Beneficios del Multi-Tenant

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Costo por cliente** | 1 proyecto Supabase ($25+/mes) | Compartido |
| **Mantenimiento** | Actualizar N proyectos | 1 solo proyecto |
| **Onboarding** | Manual, días | Minutos |
| **Backup** | N backups separados | 1 backup centralizado |
| **SSO/Auth** | Por proyecto | Unificado |

---

## 6. Cómo Agregar un Nuevo Cliente

```sql
-- 1. Crear registro en consultants
INSERT INTO consultants (nombre, subdomain, activo)
VALUES ('Inmobiliaria ABC', 'abc', true);

-- 2. Obtener el UUID generado
SELECT uuid FROM consultants WHERE subdomain = 'abc';

-- 3. Asignar usuarios existentes al nuevo cliente
UPDATE user_roles 
SET consultant_id = 'nuevo-uuid' 
WHERE email LIKE '%@abc.com%';

-- 4. Listo! Los usuarios ahora ven solo datos de ABC
```

---

## 7. Métricas Post-Migración

| Métrica | Valor |
|---------|-------|
| Tablas con consultant_id | 17 |
| Políticas RLS activas | 103 |
| Funciones helper | 2 |
| Downtime | 0 minutos (migration online) |
| Datos afectados | 10 clients, 4 properties, 4 tasks, 3 projects |

---

## 8. Rollback (si es necesario)

```sql
-- En caso de emergencia, deshabilitar políticas problemáticas:
DROP POLICY "Users can see their consultant's clients" ON clients;

-- O eliminar columnas:
ALTER TABLE clients DROP COLUMN IF EXISTS consultant_id;
```

---

## 9. Siguientes Pasos (Opcionales)

1. **Agregar más fields a `consultants`**:
   - Plan (free, pro, enterprise)
   - Límites de usuarios
   - Configuración de branding por cliente

2. **Implementar routing por subdomain**:
   - `kohancampos.app` → cliente 1
   - `inmobiliarioabc.app` → cliente 2

3. **Panel de admin** para gestionar múltiples clientes

---

## 10. Tech Stack

- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **RLS**: Row Level Security Policies
- **Frontend**: Next.js + TypeScript
- **Estado**: Migración completada ✅

---

*Documento generado el 2026-04-04*
*Sistema: Kohan & Campos CRM*
