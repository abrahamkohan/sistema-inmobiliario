-- supabase/migrations/20260404000001_add_permisos_to_user_roles.sql
-- Añade columna JSONB permisos a user_roles

ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS permisos JSONB;

-- No policies needed; column can be null.
