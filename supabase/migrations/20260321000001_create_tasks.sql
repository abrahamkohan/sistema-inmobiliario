-- Migration: create tasks table
-- Módulo de Tareas / Seguimiento para CRM inmobiliario

CREATE TABLE IF NOT EXISTS tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Título
  title         text NOT NULL,

  -- Contexto
  context       text NOT NULL DEFAULT 'lead'
                  CHECK (context IN ('lead', 'property', 'admin', 'marketing')),
  lead_id       uuid REFERENCES clients(id) ON DELETE SET NULL,
  property_id   uuid REFERENCES properties(id) ON DELETE SET NULL,

  -- Responsables
  assigned_to   uuid NOT NULL,  -- FK → auth.users (no FK constraint para evitar dep de auth schema)
  created_by    uuid NOT NULL,
  team_id       uuid,

  -- Tipo y estado
  type          text NOT NULL DEFAULT 'whatsapp'
                  CHECK (type IN ('whatsapp', 'call', 'meeting', 'email', 'visit')),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'contacted', 'rescheduled', 'closed')),
  outcome       text CHECK (outcome IN ('no_response', 'interested', 'not_interested')),
  priority      text NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high')),

  -- Fechas
  due_date      timestamptz NOT NULL,

  -- Recurrencia
  recurrence      text DEFAULT 'none'
                    CHECK (recurrence IN ('none', 'weekly', 'monthly', 'yearly')),
  recurrence_day  integer,

  -- Notas y escalado
  notes           text,
  escalated_to    uuid,

  -- Google Meet (manual, type = meeting)
  meet_link       text,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices para las queries más frecuentes
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx  ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS tasks_lead_id_idx      ON tasks (lead_id);
CREATE INDEX IF NOT EXISTS tasks_property_id_idx  ON tasks (property_id);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx     ON tasks (due_date);
CREATE INDEX IF NOT EXISTS tasks_status_idx       ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_team_id_idx      ON tasks (team_id);

-- updated_at automático
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_tasks_updated_at();

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Agent: solo ve y gestiona sus propias tareas
CREATE POLICY "agent_own_tasks" ON tasks
  FOR ALL
  USING (assigned_to = auth.uid());

-- Supervisor: puede ver tareas de su equipo
-- CREATE POLICY "supervisor_team_tasks" ON tasks
--   FOR SELECT
--   USING (
--     team_id IN (
--       SELECT team_id FROM users WHERE id = auth.uid() AND role = 'supervisor'
--     )
--   );

-- Admin: acceso total
-- CREATE POLICY "admin_all_tasks" ON tasks
--   FOR ALL
--   USING (
--     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
--   );
