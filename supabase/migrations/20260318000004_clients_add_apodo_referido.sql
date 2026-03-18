alter table clients
  add column if not exists apodo        text,
  add column if not exists referido_por text;
