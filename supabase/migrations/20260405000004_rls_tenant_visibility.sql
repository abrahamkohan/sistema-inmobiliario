-- ============================================================
-- RLS: Tenant-based visibility
-- Regla: todos los miembros del tenant ven todos los datos del tenant
-- SELECT: consultant_id = current_consultant_id()
-- NO usar assigned_to en SELECT (rompe colaboración CM ↔ agente)
-- ============================================================

-- ── CLIENTS ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "clients_select"  ON clients;
DROP POLICY IF EXISTS "clients_insert"  ON clients;
DROP POLICY IF EXISTS "clients_update"  ON clients;
DROP POLICY IF EXISTS "clients_delete"  ON clients;

-- Políticas anteriores de rls_multiagente.sql (por si quedaron activas)
DROP POLICY IF EXISTS "Agentes ven sus clientes"           ON clients;
DROP POLICY IF EXISTS "Admins ven todos los clientes"      ON clients;
DROP POLICY IF EXISTS "Agentes pueden crear clientes"      ON clients;
DROP POLICY IF EXISTS "Agentes pueden actualizar sus clientes" ON clients;
DROP POLICY IF EXISTS "Admins pueden eliminar clientes"    ON clients;

CREATE POLICY "clients_select" ON clients
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id());

CREATE POLICY "clients_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "clients_update" ON clients
  FOR UPDATE TO authenticated
  USING  (consultant_id = current_consultant_id())
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "clients_delete" ON clients
  FOR DELETE TO authenticated
  USING (consultant_id = current_consultant_id() AND is_current_user_admin());

-- ── PROPERTIES ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "properties_select"  ON properties;
DROP POLICY IF EXISTS "properties_insert"  ON properties;
DROP POLICY IF EXISTS "properties_update"  ON properties;
DROP POLICY IF EXISTS "properties_delete"  ON properties;

-- Políticas anteriores
DROP POLICY IF EXISTS "Agentes ven sus propiedades"              ON properties;
DROP POLICY IF EXISTS "Admins ven todas las propiedades"         ON properties;
DROP POLICY IF EXISTS "Agentes pueden crear propiedades"         ON properties;
DROP POLICY IF EXISTS "Agentes pueden actualizar sus propiedades" ON properties;
DROP POLICY IF EXISTS "Admins pueden eliminar propiedades"       ON properties;

CREATE POLICY "properties_select" ON properties
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id());

CREATE POLICY "properties_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "properties_update" ON properties
  FOR UPDATE TO authenticated
  USING  (consultant_id = current_consultant_id())
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "properties_delete" ON properties
  FOR DELETE TO authenticated
  USING (consultant_id = current_consultant_id() AND is_current_user_admin());

-- ── PROJECTS ─────────────────────────────────────────────────────────────────

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select"  ON projects;
DROP POLICY IF EXISTS "projects_insert"  ON projects;
DROP POLICY IF EXISTS "projects_update"  ON projects;
DROP POLICY IF EXISTS "projects_delete"  ON projects;

CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id());

CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING  (consultant_id = current_consultant_id())
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "projects_delete" ON projects
  FOR DELETE TO authenticated
  USING (consultant_id = current_consultant_id() AND is_current_user_admin());

-- ── TASKS ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tasks_select"  ON tasks;
DROP POLICY IF EXISTS "tasks_insert"  ON tasks;
DROP POLICY IF EXISTS "tasks_update"  ON tasks;
DROP POLICY IF EXISTS "tasks_delete"  ON tasks;

-- Políticas anteriores
DROP POLICY IF EXISTS "Agentes ven sus tareas"              ON tasks;
DROP POLICY IF EXISTS "Admins ven todas las tareas"         ON tasks;
DROP POLICY IF EXISTS "Agentes pueden crear tareas"         ON tasks;
DROP POLICY IF EXISTS "Agentes pueden actualizar sus tareas" ON tasks;
DROP POLICY IF EXISTS "Admins pueden eliminar tareas"       ON tasks;
DROP POLICY IF EXISTS "agent_own_tasks"                     ON tasks;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id());

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING  (consultant_id = current_consultant_id())
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (consultant_id = current_consultant_id());

-- ── NOTES ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "notes_select"  ON notes;
DROP POLICY IF EXISTS "notes_insert"  ON notes;
DROP POLICY IF EXISTS "notes_update"  ON notes;
DROP POLICY IF EXISTS "notes_delete"  ON notes;

-- Política anterior demasiado permisiva
DROP POLICY IF EXISTS "auth users full access on notes" ON notes;

CREATE POLICY "notes_select" ON notes
  FOR SELECT TO authenticated
  USING (consultant_id = current_consultant_id());

CREATE POLICY "notes_insert" ON notes
  FOR INSERT TO authenticated
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "notes_update" ON notes
  FOR UPDATE TO authenticated
  USING  (consultant_id = current_consultant_id())
  WITH CHECK (consultant_id = current_consultant_id());

CREATE POLICY "notes_delete" ON notes
  FOR DELETE TO authenticated
  USING (consultant_id = current_consultant_id());

-- ── PROPERTY_PHOTOS ──────────────────────────────────────────────────────────
-- No tiene consultant_id propio → join a properties

ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_photos_select" ON property_photos;
DROP POLICY IF EXISTS "property_photos_insert" ON property_photos;
DROP POLICY IF EXISTS "property_photos_update" ON property_photos;
DROP POLICY IF EXISTS "property_photos_delete" ON property_photos;

CREATE POLICY "property_photos_select" ON property_photos
  FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "property_photos_insert" ON property_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "property_photos_update" ON property_photos
  FOR UPDATE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "property_photos_delete" ON property_photos
  FOR DELETE TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE consultant_id = current_consultant_id()
    )
  );

-- ── PROJECT_PHOTOS ───────────────────────────────────────────────────────────
-- No tiene consultant_id propio → join a projects

ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_photos_select" ON project_photos;
DROP POLICY IF EXISTS "project_photos_insert" ON project_photos;
DROP POLICY IF EXISTS "project_photos_update" ON project_photos;
DROP POLICY IF EXISTS "project_photos_delete" ON project_photos;

CREATE POLICY "project_photos_select" ON project_photos
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "project_photos_insert" ON project_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "project_photos_update" ON project_photos
  FOR UPDATE TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "project_photos_delete" ON project_photos
  FOR DELETE TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  );

-- ── PROJECT_AMENITY_IMAGES ───────────────────────────────────────────────────
-- Mantener anon read (landing page pública)
-- Writes: solo miembros del tenant

DROP POLICY IF EXISTS "amenity_images_insert" ON project_amenity_images;
DROP POLICY IF EXISTS "amenity_images_update" ON project_amenity_images;
DROP POLICY IF EXISTS "amenity_images_delete" ON project_amenity_images;

CREATE POLICY "amenity_images_insert" ON project_amenity_images
  FOR INSERT TO authenticated
  WITH CHECK (
    amenity_id IN (
      SELECT pa.id FROM project_amenities pa
      JOIN projects p ON p.id = pa.project_id
      WHERE p.consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "amenity_images_update" ON project_amenity_images
  FOR UPDATE TO authenticated
  USING (
    amenity_id IN (
      SELECT pa.id FROM project_amenities pa
      JOIN projects p ON p.id = pa.project_id
      WHERE p.consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "amenity_images_delete" ON project_amenity_images
  FOR DELETE TO authenticated
  USING (
    amenity_id IN (
      SELECT pa.id FROM project_amenities pa
      JOIN projects p ON p.id = pa.project_id
      WHERE p.consultant_id = current_consultant_id()
    )
  );

-- ── AUTO-POPULATE consultant_id + created_by (trigger BEFORE INSERT) ─────────
-- El frontend NO necesita pasar consultant_id — se setea automáticamente.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE projects   ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE clients    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE tasks      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE notes      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION auto_set_tenant_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consultant_id IS NULL THEN
    NEW.consultant_id := current_consultant_id();
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a cada tabla de negocio
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['clients','properties','projects','tasks','notes'] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_auto_tenant_%1$s ON %1$s;
      CREATE TRIGGER trg_auto_tenant_%1$s
        BEFORE INSERT ON %1$s
        FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_fields();
    ', tbl);
  END LOOP;
END $$;

-- ── VERIFICACIÓN ─────────────────────────────────────────────────────────────

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clients','properties','projects','tasks','notes','property_photos','project_photos','project_amenity_images')
ORDER BY tablename, cmd;
