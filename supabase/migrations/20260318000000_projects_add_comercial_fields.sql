alter table projects
  add column if not exists tipo_proyecto text check (tipo_proyecto in ('residencial', 'comercial', 'mixto')),
  add column if not exists precio_desde  numeric,
  add column if not exists precio_hasta  numeric,
  add column if not exists moneda        text default 'USD' check (moneda in ('USD', 'PYG'));
