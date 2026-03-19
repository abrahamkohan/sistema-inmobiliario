-- Columnas para publicación web y badge de análisis en proyectos
alter table projects
  add column if not exists publicado_en_web boolean not null default false,
  add column if not exists badge_analisis   text check (badge_analisis in ('oportunidad', 'estable', 'a_evaluar'));
