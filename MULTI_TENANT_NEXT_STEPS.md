# 🚀 MULTI-TENANT - PASOS PARA MAÑANA

> **ESTADO: LISTO PARA EJECUTAR**  
> **NO se ejecutó nada en producción todavía**

---

## 📋 ESTADO ACTUAL

### ✓ Listo ( Preparado ):
- [x] Plan de arquitectura documentado (`MULTI_TENANT_PLAN.md`)
- [x] Script de migración creado
- [x] Decisiones tomadas (Opción D - Híbrido)
- [x] Commit pusheado a main

### ⏳ Pendiente (para mañana):
- [ ] Ejecutar backup en Supabase
- [ ] Ejecutar script de migración
- [ ] Validar que todo funciona

---

## 🎯 QUÉ NO SE EJECUTÓ NUNCA

❌ **NADA** - El script está creado pero NO se corrió en producción.

Para confirmar:
- Revisa el log de migraciones en Supabase
- NO hay tabla `consultants` (todavía es `consultora_config`)
- NO hay columna `consultant_id` en las tablas

---

## 📋 PASOS EXACTOS PARA MAÑANA

### 1. BACKUP (OBLIGATORIO)

1. Ir a **Supabase Dashboard**
2. Settings → Database
3. **Create restore point**
4. Nombre: `pre-multi-tenant-migration`
5. Confirmar

---

### 2. EJECUTAR MIGRATION SQL

1. Abrir **SQL Editor** en Supabase
2. Copiar todo el contenido de:
   ```
   supabase/migrations/20260405000001_multi_tenant_migration.sql
   ```
3. Ejecutar (botón "Run")
4. Verificar que NO hay errores

---

### 3. VERIFICAR DATOS MIGRADOS

Ejecutar esta query:

```sql
SELECT 
  'clients' as table_name,
  COUNT(*) as total,
  COUNT(consultant_id) as with_consultant_id,
  COUNT(*) - COUNT(consultant_id) as missing
FROM clients
UNION ALL
SELECT 'properties', COUNT(*), COUNT(consultant_id), COUNT(*) - COUNT(consultant_id) FROM properties
UNION ALL
SELECT 'profiles', COUNT(*), COUNT(consultant_id), COUNT(*) - COUNT(consultant_id) FROM profiles;
```

**Esperado**: `with_consultant_id` = `total` (todos tienen valor)

---

### 4. VERIFICAR LOGIN

1. Cerrar sesión
2. Loguearse nuevamente
3. Verificar que puede entrar

**Si NO funciona**: Ejecutar rollback

---

### 5. VERIFICAR RLS

En SQL Editor:

```sql
-- Ver políticas activas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Esperado**: Políticas para `clients`, `profiles` con `current_consultant_id()`

---

### 6. TESTEAR MÓDULOS

| Módulo | Qué verificar |
|--------|---------------|
| CRM | Veo mis clientes |
| Propiedades | Veo mis propiedades |
| Tareas | Veo mis tareas |
| Configuración | Branding funciona |

---

## ✅ CHECKLIST DE VALIDACIÓN

Después de ejecutar, verificar TODOS estos puntos:

- [ ] Puedo loguearme
- [ ] Veo mis datos (clients, properties, tasks)
- [ ] NO veo datos de otros (consultant_id diferente)
- [ ] Branding sigue funcionando (colores, logo)
- [ ] Permisos de usuario siguen iguales

---

## 🔴 PLAN DE ROLLBACK

### Si algo falla:

**Opción 1 - Rápido** (deshabilitar políticas nuevas):
```sql
DROP POLICY "Users can see their consultant's clients" ON clients;
DROP POLICY "Users can see their profile" ON profiles;
-- Repetir para cada tabla
```

**Opción 2 - Completo** (restaurar backup):
1. Ir a Supabase Dashboard → Settings → Database
2. Click en **Restore** junto al restore point creado
3. Seleccionar `pre-multi-tenant-migration`
4. Confirmar

**Tiempo de restauración**: ~5-10 minutos

---

## ⚠️ RIESGOS A MONITOREAR

### Lo que puede romperse primero:
1. **Login** - Si RLS de profiles bloquea
2. **Consultas** - Si no devuelve datos
3. **Branding** - Si no carga configuración

### Qué mirar apenas deployes:
- Abrir consola (F12) → Network
- Login request → 200 OK?
- Dashboard load → datos visibles?

---

## 📂 ARCHIVOS CLAVE

| Archivo | Para qué |
|---------|----------|
| `MULTI_TENANT_PLAN.md` | Referencia teoría |
| `supabase/migrations/20260405000001_multi_tenant_migration.sql` | El script a ejecutar |

---

## ⏰ CUÁNDO EJECUTAR

**Recomendado**: Horario de baja actividad
- Madrugada (2-4 AM)
- O fin de semana

**Tiempo estimado**: 5-10 minutos

---

## 🚀 RESUMEN EJECUTIVO

| Paso | Acción |
|------|--------|
| 1 | Backup en Supabase |
| 2 | Ejecutar script SQL |
| 3 | Verificar datos |
| 4 | Testear login y módulos |
| 5 | Si todo OK → Listo! |
| 6 | Si falla → Rollback |

---

**Listo para ejecutar. Nos vemos mañana.** 🎯
