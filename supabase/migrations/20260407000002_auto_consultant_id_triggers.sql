-- Triggers que auto-setean consultant_id en tablas con RLS por tenant.
-- Evita que los inserts fallen cuando el frontend no manda consultant_id
-- o cuando manda un valor inválido ('default').

-- ── clients ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auto_set_client_consultant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consultant_id IS NULL OR NEW.consultant_id::text = 'default' THEN
    SELECT consultant_id INTO NEW.consultant_id
    FROM user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_client_consultant_id ON clients;
CREATE TRIGGER trg_client_consultant_id
  BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION auto_set_client_consultant_id();

-- ── properties ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auto_set_property_consultant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consultant_id IS NULL OR NEW.consultant_id::text = 'default' THEN
    SELECT consultant_id INTO NEW.consultant_id
    FROM user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_property_consultant_id ON properties;
CREATE TRIGGER trg_property_consultant_id
  BEFORE INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION auto_set_property_consultant_id();
