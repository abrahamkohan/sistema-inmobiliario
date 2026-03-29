-- Agrega FK opcional a projects en la tabla commissions
ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_project ON commissions(project_id);
