-- Separar ubicación en zona y dirección
-- location se mantiene como fallback (no se elimina)

ALTER TABLE projects ADD COLUMN zona      text;
ALTER TABLE projects ADD COLUMN direccion text;
