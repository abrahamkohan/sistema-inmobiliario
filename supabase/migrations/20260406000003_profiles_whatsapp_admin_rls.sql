-- ============================================================
-- 1. Agregar columna whatsapp a profiles
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- ============================================================
-- 2. RPC: exponer emails del equipo (SECURITY DEFINER para
--    poder leer auth.users sin exponer toda la tabla)
-- ============================================================

CREATE OR REPLACE FUNCTION get_team_emails()
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consultant_id UUID;
BEGIN
  SELECT ur.consultant_id INTO v_consultant_id
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;

  IF v_consultant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT ur.user_id, au.email::TEXT
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.consultant_id = v_consultant_id;
END;
$$;

-- ============================================================
-- 3. RLS: admin puede actualizar profiles del mismo tenant
-- ============================================================

CREATE POLICY "admin_update_team_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles my_role
    JOIN public.user_roles target_role ON target_role.user_id = profiles.id
    WHERE my_role.user_id  = auth.uid()
      AND my_role.role     = 'admin'
      AND my_role.consultant_id = target_role.consultant_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles my_role
    JOIN public.user_roles target_role ON target_role.user_id = profiles.id
    WHERE my_role.user_id  = auth.uid()
      AND my_role.role     = 'admin'
      AND my_role.consultant_id = target_role.consultant_id
  )
);
