-- ═══════════════════════════════════════════════════════════════════════════════
-- PROTECCIÓN DE OWNER EN user_roles
-- Agrega `is_owner` flag + policies que impiden modificar o eliminar al owner.
-- Reutilizable: no hardcodea ningún UUID. El owner se asigna manualmente.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Columna is_owner ─────────────────────────────────────────────────────
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT false;

-- ─── 2. Policy UPDATE — admins pueden cambiar roles, pero NO al owner ─────────
--    USING   → no puede ejecutarse sobre filas donde is_owner = true
--    WITH CHECK → el resultado de la fila nunca puede tener is_owner = true
CREATE POLICY "admins_update_roles" ON user_roles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    AND NOT is_owner
  )
  WITH CHECK (
    NOT is_owner
  );

-- ─── 3. Policy DELETE — admins pueden quitar acceso, pero NO al owner ─────────
CREATE POLICY "admins_delete_roles" ON user_roles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    AND NOT is_owner
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO MANUAL — ejecutar UNA SOLA VEZ por tenant en Supabase SQL Editor
-- NO ejecutar desde migraciones. El UUID es propio de cada instancia.
--
--   1. Ir a Supabase Dashboard → Authentication → Users
--   2. Copiar el User UID del propietario del sistema
--   3. Ejecutar en SQL Editor:
--
--      UPDATE user_roles
--      SET is_owner = true
--      WHERE user_id = '<auth-uid-del-propietario>';
--
-- NOTA: is_owner = true nunca puede asignarse via API (bloqueado por RLS).
--       Solo es posible desde el SQL Editor con service_role.
-- ═══════════════════════════════════════════════════════════════════════════════
