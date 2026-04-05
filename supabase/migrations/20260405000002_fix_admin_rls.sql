-- ============================================================
-- Fix: is_current_user_admin debe incluir is_owner
-- Fix: clients RLS faltaba OR is_current_user_admin()
-- ============================================================

-- 1. Actualizar función para incluir propietario
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR is_owner = true)
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Clients: restaurar acceso admin en todas las operaciones
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;

-- SELECT: tenant match + (asignado ó admin)
CREATE POLICY "clients_select" ON clients
  FOR SELECT TO authenticated
  USING (
    consultant_id = current_consultant_id()
    AND (
      assigned_to = auth.uid()
      OR is_current_user_admin()
    )
  );

-- INSERT: solo dentro del tenant del usuario
CREATE POLICY "clients_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    consultant_id = current_consultant_id()
  );

-- UPDATE: asignado ó admin, dentro del mismo tenant
CREATE POLICY "clients_update" ON clients
  FOR UPDATE TO authenticated
  USING (
    consultant_id = current_consultant_id()
    AND (
      assigned_to = auth.uid()
      OR is_current_user_admin()
    )
  )
  WITH CHECK (
    consultant_id = current_consultant_id()
  );

-- DELETE: solo admin
CREATE POLICY "clients_delete" ON clients
  FOR DELETE TO authenticated
  USING (
    consultant_id = current_consultant_id()
    AND is_current_user_admin()
  );
