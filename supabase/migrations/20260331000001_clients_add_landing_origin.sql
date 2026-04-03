-- Bloque 5: Lead capture desde landings públicas
-- Agrega columnas de origen de landing a la tabla clients

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS landing_tipo    text    CHECK (landing_tipo IN ('propiedad', 'proyecto')),
  ADD COLUMN IF NOT EXISTS property_id     uuid    REFERENCES properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id      uuid    REFERENCES projects(id)   ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS whatsapp        text,
  ADD COLUMN IF NOT EXISTS mensaje         text,
  ADD COLUMN IF NOT EXISTS utm_source      text,
  ADD COLUMN IF NOT EXISTS utm_medium      text,
  ADD COLUMN IF NOT EXISTS utm_campaign    text;

-- Policy endurecida para inserts anónimos desde landings
-- Requiere: tipo lead, fuente conocida, landing_tipo válido, y al menos un FK
DROP POLICY IF EXISTS "anon_lead_insert" ON clients;

CREATE POLICY "anon_lead_insert" ON clients
  FOR INSERT TO anon
  WITH CHECK (
    tipo = 'lead'
    AND fuente IN ('landing_propiedad', 'landing_proyecto')
    AND landing_tipo IN ('propiedad', 'proyecto')
    AND (property_id IS NOT NULL OR project_id IS NOT NULL)
  );
