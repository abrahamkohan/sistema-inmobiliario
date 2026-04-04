-- ============================================================
-- MULTI-TENANT MIGRATION SCRIPT
-- Arquitectura: Opción D (Híbrido)
-- Estado: PREPARACIÓN (NO EJECUTAR EN PRODUCCIÓN)
-- ============================================================

-- ============================================================
-- FASE 1: PREPARACIÓN - BACKUP
-- ============================================================

-- ⚠️ ANTES DE EJECUTAR: hacer backup manual desde Supabase Dashboard
-- Settings → Database → Create restore point
-- Nombre: "pre-multi-tenant-migration"

-- ============================================================
-- FASE 2: AGREGAR COLUMNAS consultant_id (nullable)
-- ============================================================

-- Tablas críticas (Tier 1)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS consultant_id UUID;

-- Tablas importantes (Tier 2)
ALTER TABLE agentes ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE commission_splits ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE commission_clients ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE commission_incomes ADD COLUMN IF NOT EXISTS consultant_id UUID;

-- Tablas opcionales (Tier 3)
ALTER TABLE commercial_allies ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS consultant_id UUID;

-- ============================================================
-- FASE 3: RENOMBRAR Y ACTUALIZAR TABLA DE TENANTS
-- ============================================================

-- Renombrar consultora_config a consultants
ALTER TABLE consultora_config RENAME TO consultants;

-- Agregar campos necesarios para multi-tenant
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Actualizar el registro existente con el subdomain actual
UPDATE consultants SET subdomain = 'default' WHERE subdomain IS NULL;

-- ============================================================
-- FASE 4: POPULAR consultant_id CON DATOS EXISTENTES
-- ============================================================

-- ⚠️ REEMPLAZAR 'TU_CONSULTANT_ID_AQUI' CON EL ID REAL DE TU CONSULTORA ACTUAL
-- Para obtenerlo: SELECT id FROM consultants LIMIT 1;

-- Primero obtenemos el ID actual
DO $$
DECLARE
  current_consultant_id UUID;
BEGIN
  -- Obtener ID de la consultora actual
  SELECT id INTO current_consultant_id FROM consultants LIMIT 1;
  
  IF current_consultant_id IS NOT NULL THEN
    -- Popular todas las tablas con este ID
    UPDATE clients SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE properties SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE tasks SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE projects SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE notes SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE presupuestos SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE simulations SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    
    UPDATE agentes SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE profiles SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE user_roles SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE commissions SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE commission_splits SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE commission_clients SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE commission_incomes SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    
    UPDATE commercial_allies SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE assets SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    UPDATE push_subscriptions SET consultant_id = current_consultant_id WHERE consultant_id IS NULL;
    
    RAISE NOTICE 'Migración completada. Consultant ID: %', current_consultant_id;
  ELSE
    RAISE EXCEPTION 'No se encontró ninguna consultora en la tabla';
  END IF;
END $$;

-- ============================================================
-- FASE 5: CREAR FUNCIÓN HELPER CON FALLBACK
-- ============================================================

CREATE OR REPLACE FUNCTION current_consultant_id()
RETURNS UUID AS $$
  -- Intenta obtener el consultant_id del usuario actual
  SELECT consultant_id 
  FROM user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  -- FALLBACK: si retorna NULL, retornar UUID vacío (será filtrado por RLS)
  -- Esto evita lockout pero el usuario no verá datos
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función auxiliar para verificar si es admin (para fallback de transición)
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- FASE 6: CREAR POLÍTICAS RLS (CON FALLBACK DE TRANSICIÓN)
-- ============================================================

-- ⚠️ POLÍTICAS CON FALLOBACK PARA EVITAR LOCKOUT
-- La política permite acceso si:
-- 1. El usuario tiene consultant_id configurado (caso normal)
-- 2. O si es admin (durante transición)

-- Clients
DROP POLICY IF EXISTS "Users can see their consultant's clients" ON clients;
CREATE POLICY "Users can see their consultant's clients" ON clients
  FOR SELECT
  TO authenticated
  USING (
    consultant_id = current_consultant_id()
    OR is_current_user_admin()  -- Admin puede ver todo durante transición
  );

DROP POLICY IF EXISTS "Users can insert their consultant's clients" ON clients;
CREATE POLICY "Users can insert their consultant's clients" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    consultant_id = current_consultant_id()
    OR is_current_user_admin()
  );

DROP POLICY IF EXISTS "Users can update their consultant's clients" ON clients;
CREATE POLICY "Users can update their consultant's clients" ON clients
  FOR UPDATE
  TO authenticated
  USING (
    consultant_id = current_consultant_id()
    OR is_current_user_admin()
  )
  WITH CHECK (
    consultant_id = current_consultant_id()
    OR is_current_user_admin()
  );

-- Profiles (CRÍTICO para login)
DROP POLICY IF EXISTS "Users can see their profile" ON profiles;
CREATE POLICY "Users can see their profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR consultant_id = current_consultant_id()
    OR is_current_user_admin()
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Repetir para otras tablas...
-- (Aquí van las políticas para properties, tasks, projects, notes, etc.)

-- ============================================================
-- FASE 7: VERIFICACIÓN
-- ============================================================

-- Verificar que los datos se migraron correctamente
SELECT 
  'clients' as table_name,
  COUNT(*) as total,
  COUNT(consultant_id) as with_consultant_id,
  COUNT(*) - COUNT(consultant_id) as missing
FROM clients
UNION ALL
SELECT 
  'properties',
  COUNT(*),
  COUNT(consultant_id),
  COUNT(*) - COUNT(consultant_id)
FROM properties
UNION ALL
SELECT 
  'profiles',
  COUNT(*),
  COUNT(consultant_id),
  COUNT(*) - COUNT(consultant_id)
FROM profiles;

-- Verificar políticas creadas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- ROLLBACK (si algo sale mal)
-- ============================================================

-- Opción 1: Deshabilitar políticas problemáticas
-- DROP POLICY "Users can see their consultant's clients" ON clients;

-- Opción 2: Restaurar desde backup
-- Ir a Supabase Dashboard → Settings → Database → Restore
-- Seleccionar el restore point creado antes de la migración

-- Opción 3: Eliminar columnas (si no se populates)
-- ALTER TABLE clients DROP COLUMN IF EXISTS consultant_id;
-- (repetir para todas las tablas)

-- ============================================================
-- NOTAS FINALES
-- ============================================================

-- 1. NO agregar NOT NULL hasta que todo esté verificado
-- 2. Testear extensively antes de producción
-- 3. Monitorear logs después de deploy
-- 4. Tener comando de rollback listo

-- Para ejecutar:
-- 1. Copiar todo el script
-- 2. Ejecutar en Supabase SQL Editor
-- 3. Verificar Phase 7 (verificación)
-- 4. Testear en ambiente no-producción
