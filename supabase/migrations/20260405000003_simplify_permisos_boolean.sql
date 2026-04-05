-- ============================================================
-- SIMPLIFICAR SISTEMA DE PERMISOS: string levels → boolean
-- ============================================================

-- 1. Usuarios CON permisos: convertir 'read'/'write'/'full' → true, 'none' → false
UPDATE user_roles
SET permisos = (
  SELECT jsonb_object_agg(
    key,
    CASE
      WHEN value::text IN ('"read"', '"write"', '"full"', 'true') THEN to_jsonb(true)
      ELSE to_jsonb(false)
    END
  )
  FROM jsonb_each(permisos)
)
WHERE permisos IS NOT NULL AND jsonb_typeof(permisos) = 'object';

-- 2. Usuarios SIN permisos (null): inicializar según su rol
--    read/write/full en DEFAULT_PERMISSIONS → true, none → false
--    Hardcoded para los 4 roles base + viewer
UPDATE user_roles
SET permisos = CASE role
  WHEN 'admin' THEN
    '{"crm":true,"tareas":true,"notas":true,"propiedades":true,"proyectos":true,"ventas":true,"simulador":true,"flip":true,"presupuestos":true,"reportes":true,"marketing":true,"configuracion":true}'::jsonb
  WHEN 'agente' THEN
    '{"crm":true,"tareas":true,"notas":true,"propiedades":true,"proyectos":true,"ventas":false,"simulador":false,"flip":false,"presupuestos":false,"reportes":true,"marketing":false,"configuracion":false}'::jsonb
  WHEN 'cm' THEN
    '{"crm":false,"tareas":true,"notas":true,"propiedades":true,"proyectos":true,"ventas":false,"simulador":false,"flip":false,"presupuestos":false,"reportes":false,"marketing":true,"configuracion":false}'::jsonb
  WHEN 'finanzas' THEN
    '{"crm":false,"tareas":false,"notas":false,"propiedades":false,"proyectos":false,"ventas":true,"simulador":true,"flip":true,"presupuestos":true,"reportes":true,"marketing":false,"configuracion":false}'::jsonb
  ELSE
    '{"crm":true,"tareas":true,"notas":true,"propiedades":true,"proyectos":true,"ventas":false,"simulador":false,"flip":false,"presupuestos":false,"reportes":true,"marketing":false,"configuracion":false}'::jsonb
END
WHERE permisos IS NULL;
