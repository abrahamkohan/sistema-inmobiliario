-- Módulo NOTAS: captura rápida de ideas (estilo Drafts)
-- Filosofía: escribir primero, organizar después

CREATE TABLE notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content       TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT 'inbox',   -- 'inbox' | 'archive' | 'trash'
  is_flagged    BOOLEAN NOT NULL DEFAULT false,
  tags          TEXT[] DEFAULT '{}',
  reminder_date TIMESTAMPTZ,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at automático
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users full access on notes" ON notes
  FOR ALL USING (auth.role() = 'authenticated');

-- Índices útiles
CREATE INDEX notes_location_idx    ON notes(location);
CREATE INDEX notes_is_flagged_idx  ON notes(is_flagged);
CREATE INDEX notes_reminder_idx    ON notes(reminder_date) WHERE reminder_date IS NOT NULL;
CREATE INDEX notes_updated_at_idx  ON notes(updated_at DESC);
