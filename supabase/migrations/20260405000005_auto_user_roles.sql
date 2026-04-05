-- ============================================================
-- Auto-crear fila en user_roles cuando se registra un usuario
-- + RPC para upsert seguro de permisos (no rompe role ni is_owner)
-- ============================================================

-- ── 1. TRIGGER: auto-crear user_roles en auth.users INSERT ───────────────────

CREATE OR REPLACE FUNCTION create_user_roles_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_consultant_id UUID;
BEGIN
  -- Obtener consultant_id desde user metadata (si se pasó en el invite)
  -- Fallback: usar el del primer user_roles existente (mono-tenant por ahora)
  v_consultant_id := (NEW.raw_user_meta_data->>'consultant_id')::UUID;

  IF v_consultant_id IS NULL THEN
    SELECT consultant_id INTO v_consultant_id
    FROM public.user_roles
    WHERE consultant_id IS NOT NULL
    LIMIT 1;
  END IF;

  INSERT INTO public.user_roles (user_id, role, is_owner, consultant_id, permisos)
  VALUES (NEW.id, 'agente', false, v_consultant_id, '{}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_user_roles ON auth.users;
CREATE TRIGGER trg_create_user_roles
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_roles_on_signup();

-- ── 2. PARCHAR usuarios existentes sin fila en user_roles ────────────────────

INSERT INTO public.user_roles (user_id, role, is_owner, consultant_id, permisos)
SELECT
  p.id,
  'agente',
  false,
  (SELECT consultant_id FROM public.user_roles WHERE consultant_id IS NOT NULL LIMIT 1),
  '{}'::jsonb
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ── 3. RPC: upsert seguro de permisos ────────────────────────────────────────
-- Usa INSERT ... ON CONFLICT DO UPDATE SET permisos = EXCLUDED.permisos
-- → no toca role, is_owner, consultant_id si la fila ya existe
-- → si no existe, crea con role='agente' (fallback)

CREATE OR REPLACE FUNCTION upsert_user_permisos(p_user_id UUID, p_permisos JSONB)
RETURNS void AS $$
DECLARE
  v_consultant_id UUID;
BEGIN
  SELECT consultant_id INTO v_consultant_id
  FROM public.user_roles
  WHERE user_id = p_user_id;

  IF v_consultant_id IS NULL THEN
    SELECT consultant_id INTO v_consultant_id
    FROM public.user_roles
    WHERE consultant_id IS NOT NULL
    LIMIT 1;
  END IF;

  INSERT INTO public.user_roles (user_id, role, is_owner, consultant_id, permisos)
  VALUES (p_user_id, 'agente', false, v_consultant_id, p_permisos)
  ON CONFLICT (user_id)
  DO UPDATE SET permisos = EXCLUDED.permisos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
