-- ============================================================
-- Fix: RLS completo para project_amenities y project_amenity_images
-- ============================================================
-- Problema: project_amenities tenía solo anon SELECT.
-- Usuarios autenticados no podían INSERT / UPDATE / DELETE.
-- ============================================================

ALTER TABLE project_amenities ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "anon read"                      ON project_amenities;
DROP POLICY IF EXISTS "project_amenities_select"       ON project_amenities;
DROP POLICY IF EXISTS "project_amenities_insert"       ON project_amenities;
DROP POLICY IF EXISTS "project_amenities_update"       ON project_amenities;
DROP POLICY IF EXISTS "project_amenities_delete"       ON project_amenities;

-- Anon: solo lectura pública (para el frontend público)
CREATE POLICY "project_amenities_anon_select" ON project_amenities
  FOR SELECT TO anon
  USING (true);

-- Authenticated: acceso completo a sus propios proyectos
CREATE POLICY "project_amenities_select" ON project_amenities
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "project_amenities_insert" ON project_amenities
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "project_amenities_update" ON project_amenities
  FOR UPDATE TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  );

CREATE POLICY "project_amenities_delete" ON project_amenities
  FOR DELETE TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE consultant_id = current_consultant_id()
    )
  );

-- ============================================================
-- project_amenity_images: mismo patrón
-- ============================================================

ALTER TABLE project_amenity_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read"               ON project_amenity_images;
DROP POLICY IF EXISTS "amenity_images_insert"   ON project_amenity_images;
DROP POLICY IF EXISTS "amenity_images_update"   ON project_amenity_images;
DROP POLICY IF EXISTS "amenity_images_delete"   ON project_amenity_images;
DROP POLICY IF EXISTS "amenity_images_select"   ON project_amenity_images;

-- Anon: lectura pública
CREATE POLICY "amenity_images_anon_select" ON project_amenity_images
  FOR SELECT TO anon
  USING (true);

-- Authenticated: acceso completo vía join a project_amenities → projects
CREATE POLICY "amenity_images_select" ON project_amenity_images
  FOR SELECT TO authenticated
  USING (
    amenity_id IN (
      SELECT pa.id FROM project_amenities pa
      JOIN projects p ON p.id = pa.project_id
      WHERE p.consultant_id = current_consultant_id()
    )
  );

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
  )
  WITH CHECK (
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
