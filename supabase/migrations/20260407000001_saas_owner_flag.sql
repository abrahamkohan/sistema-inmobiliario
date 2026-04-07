-- Flag para el owner del SaaS (distinto del owner de cada tenant).
-- Solo el owner de la plataforma puede acceder al dashboard de admin.

ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS is_saas_owner BOOLEAN NOT NULL DEFAULT FALSE;

-- Setear el flag para el usuario actual (abrahamkohan).
-- Ajustar si el owner del SaaS cambia.
UPDATE user_roles
SET is_saas_owner = TRUE
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'abrahamkohan@gmail.com' LIMIT 1
);
