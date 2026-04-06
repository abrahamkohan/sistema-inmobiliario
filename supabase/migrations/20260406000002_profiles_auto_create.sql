-- ============================================================
-- Auto-crear fila en profiles cuando se registra un usuario
-- + Parchear usuarios existentes sin fila en profiles
-- ============================================================

-- ── 1. TRIGGER: auto-crear profiles en auth.users INSERT ─────────────────────

CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name    TEXT;
  v_consultant_id UUID;
BEGIN
  -- Leer nombre desde metadata del invite (si se pasó)
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- Leer consultant_id desde metadata del invite
  v_consultant_id := (NEW.raw_user_meta_data->>'consultant_id')::UUID;

  -- Fallback: usar consultant_id del primer user_roles existente
  IF v_consultant_id IS NULL THEN
    SELECT consultant_id INTO v_consultant_id
    FROM public.user_roles
    WHERE consultant_id IS NOT NULL
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, full_name, consultant_id, created_at)
  VALUES (NEW.id, v_full_name, v_consultant_id, NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_profile ON auth.users;
CREATE TRIGGER trg_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- ── 2. Parchear usuarios existentes sin fila en profiles ─────────────────────

INSERT INTO public.profiles (id, full_name, created_at)
SELECT
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
