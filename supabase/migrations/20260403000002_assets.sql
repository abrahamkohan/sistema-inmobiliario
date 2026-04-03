-- supabase/migrations/20260403000002_assets.sql
-- Fase 3: tabla de assets/media reutilizables

CREATE TABLE assets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url          TEXT        NOT NULL,
  -- Para supabase: storage path (para poder borrar); para external: la URL original
  storage_type TEXT        CHECK (storage_type IN ('supabase', 'external')),
  external_url TEXT,
  type         TEXT        NOT NULL CHECK (type IN ('brand', 'property', 'project', 'document')),
  subtipo      TEXT        NOT NULL CHECK (subtipo IN (
                             'logo', 'logo_light', 'favicon', 'hero',
                             'gallery', 'floor_plan', 'brochure', 'contract', 'other'
                           )),
  nombre       TEXT        NOT NULL,
  alt_text     TEXT,
  activo       BOOLEAN     DEFAULT true,
  version      INTEGER     DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_usages (
  asset_id   UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('property', 'project', 'landing', 'brand')),
  usage_id   TEXT NOT NULL,
  PRIMARY KEY (asset_id, usage_type, usage_id)
);

CREATE INDEX idx_assets_type_subtipo   ON assets(type, subtipo);
CREATE INDEX idx_assets_activo         ON assets(activo);
CREATE INDEX idx_asset_usages_asset_id ON asset_usages(asset_id);
CREATE INDEX idx_assets_usages_lookup  ON asset_usages(usage_type, usage_id);

-- RLS: solo usuarios autenticados pueden leer/escribir
ALTER TABLE assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_assets"       ON assets       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert_assets"     ON assets       FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_assets"     ON assets       FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_assets"     ON assets       FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_read_usages"       ON asset_usages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert_usages"     ON asset_usages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_usages"     ON asset_usages FOR DELETE USING (auth.role() = 'authenticated');
