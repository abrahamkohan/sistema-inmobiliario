-- Crea o reemplaza la función upsert_user_permisos
-- Permite guardar permisos de usuario de forma segura (upsert)
CREATE OR REPLACE FUNCTION public.upsert_user_permisos(
  p_user_id UUID,
  p_permisos JSONB
)
RETURNS void AS $$
DECLARE
  v_consultant_id UUID;
BEGIN
  SELECT consultant_id INTO v_consultant_id
  FROM public.user_roles
  WHERE user_id = p_user_id;

  INSERT INTO public.user_roles (user_id, role, is_owner, consultant_id, permisos)
  VALUES (p_user_id, 'agente', false, v_consultant_id, p_permisos)
  ON CONFLICT (user_id)
  DO UPDATE SET permisos = EXCLUDED.permisos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
