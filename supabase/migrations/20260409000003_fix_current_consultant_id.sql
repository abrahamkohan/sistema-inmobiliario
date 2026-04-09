-- ============================================================
-- Fix: current_consultant_id() fallback a user_roles
-- ============================================================
-- Problema: la función leía SOLO del JWT claim user_metadata.consultant_id.
-- Si el JWT no tiene ese claim (ej: usuarios invitados sin metadata actualizada),
-- todas las policies devuelven NULL → no pueden ver/editar nada.
--
-- Solución: intentar JWT primero (rápido), caer a user_roles si no está.
-- Esto garantiza acceso para ambos socios aunque el JWT no esté actualizado.
-- ============================================================

CREATE OR REPLACE FUNCTION current_consultant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    -- Intento 1: leer del JWT (rápido, sin hit a DB)
    NULLIF(TRIM(auth.jwt() -> 'user_metadata' ->> 'consultant_id'), '')::UUID,
    -- Fallback: leer de user_roles (siempre actualizado)
    (SELECT consultant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Verificación: mostrar consultant_id de todos los usuarios
-- para confirmar que el segundo socio tiene uno asignado.
-- ============================================================
SELECT
  u.email,
  ur.role,
  ur.is_owner,
  ur.consultant_id,
  ur.user_id
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY ur.is_owner DESC NULLS LAST, u.email;
