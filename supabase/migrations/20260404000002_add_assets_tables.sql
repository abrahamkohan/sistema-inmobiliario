-- Migration: create assets and asset_usages tables

CREATE TABLE IF NOT EXISTS assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT NOT NULL,
  storage_type  TEXT CHECK (storage_type IN ('supabase', 'external')),
  external_url  TEXT,
  type          TEXT NOT NULL CHECK (type IN ('brand', 'property', 'project', 'document')),
  subtipo       TEXT NOT NULL CHECK (subtipo IN (
    'logo', 'logo_light', 'favicon', 'hero',
    'gallery', 'floor_plan', 'brochure', 'contract', 'other'
  )) ,
  nombre        TEXT NOT NULL,
  alt_text      TEXT,
  activo        BOOLEAN DEFAULT true,
  version       INTEGER DEFAULT 1,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_usages (
  asset_id    UUID REFERENCES assets(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('property', 'project', 'landing', 'brand')),
  usage_id   TEXT NOT NULL,
  PRIMARY KEY (asset_id, usage_type, usage_id)
);

CREATE INDEX IF NOT EXISTS idx_assets_type_subtipo ON assets(type, subtipo);
CREATE INDEX IF NOT EXISTS idx_assets_usages_lookup ON asset_usages(usage_type, usage_id);
