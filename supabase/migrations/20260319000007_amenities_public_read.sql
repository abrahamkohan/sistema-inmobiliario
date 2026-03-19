-- Permitir lectura pública (anon) de amenities y sus imágenes
-- Necesario para que kohancampos-web (anon key) pueda mostrarlos

CREATE POLICY "anon read" ON project_amenities
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon read" ON project_amenity_images
  FOR SELECT TO anon USING (true);
