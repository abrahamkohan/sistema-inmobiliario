-- ============================================================
-- SCRIPT RLS - Sistema Inmobiliario Multiagente
-- Tablas: clients (leads), properties, tasks, profiles
-- Tabla roles: user_roles con user_id, role
-- ============================================================

-- ============================================================
-- FUNCIÓN HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- 1. TABLA: profiles (perfiles de usuarios)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven su perfil" ON profiles;
DROP POLICY IF EXISTS "Admins ven todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios actualizan su perfil" ON profiles;

CREATE POLICY "Usuarios ven su perfil" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Admins ven todos los perfiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Usuarios actualizan su perfil" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 2. TABLA: clients (leads y clientes)
-- ============================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agentes ven sus clientes" ON clients;
DROP POLICY IF EXISTS "Admins ven todos los clientes" ON clients;
DROP POLICY IF EXISTS "Agentes pueden crear clientes" ON clients;
DROP POLICY IF EXISTS "Agentes pueden actualizar sus clientes" ON clients;
DROP POLICY IF EXISTS "Admins pueden eliminar clientes" ON clients;

CREATE POLICY "Agentes ven sus clientes" ON clients
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR is_admin());

CREATE POLICY "Agentes pueden crear clientes" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Agentes pueden actualizar sus clientes" ON clients
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Admins pueden eliminar clientes" ON clients
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- 3. TABLA: properties (propiedades)
-- ============================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agentes ven sus propiedades" ON properties;
DROP POLICY IF EXISTS "Admins ven todas las propiedades" ON properties;
DROP POLICY IF EXISTS "Agentes pueden crear propiedades" ON properties;
DROP POLICY IF EXISTS "Agentes pueden actualizar sus propiedades" ON properties;
DROP POLICY IF EXISTS "Admins pueden eliminar propiedades" ON properties;

CREATE POLICY "Agentes ven sus propiedades" ON properties
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR is_admin());

CREATE POLICY "Agentes pueden crear propiedades" ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Agentes pueden actualizar sus propiedades" ON properties
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Admins pueden eliminar propiedades" ON properties
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- 4. TABLA: tasks (tareas)
-- ============================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agentes ven sus tareas" ON tasks;
DROP POLICY IF EXISTS "Admins ven todas las tareas" ON tasks;
DROP POLICY IF EXISTS "Agentes pueden crear tareas" ON tasks;
DROP POLICY IF EXISTS "Agentes pueden actualizar sus tareas" ON tasks;
DROP POLICY IF EXISTS "Admins pueden eliminar tareas" ON tasks;

CREATE POLICY "Agentes ven sus tareas" ON tasks
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR is_admin());

CREATE POLICY "Agentes pueden crear tareas" ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Agentes pueden actualizar sus tareas" ON tasks
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Admins pueden eliminar tareas" ON tasks
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- 5. TABLA: agents (agentes - tabla de comisiones)
-- ============================================================

ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos ven agentes" ON agentes;

CREATE POLICY "Todos ven agentes" ON agentes
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 6. TABLA: commercial_allies (aliados comerciales)
-- ============================================================

ALTER TABLE commercial_allies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo admins manejan aliados" ON commercial_allies;

CREATE POLICY "Solo admins manejan aliados" ON commercial_allies
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- 7. TABLA: consultora_config (config de marca)
-- ============================================================

ALTER TABLE consultora_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo admins ven config" ON consultora_config;
DROP POLICY IF EXISTS "Solo admins modifican config" ON consultora_config;

CREATE POLICY "Solo admins ven config" ON consultora_config
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Solo admins modifican config" ON consultora_config
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- 8. TABLA: assets (imágenes de marca)
-- ============================================================

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos ven assets" ON assets;

CREATE POLICY "Todos ven assets" ON assets
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Ver políticas creadas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Ver tablas con RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
