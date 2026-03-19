-- Amenities dinámicos con imágenes para proyectos
create table if not exists project_amenities (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name       text not null,
  sort_order int  not null default 0,
  created_at timestamptz default now()
);

create table if not exists project_amenity_images (
  id           uuid primary key default gen_random_uuid(),
  amenity_id   uuid not null references project_amenities(id) on delete cascade,
  storage_path text not null,
  sort_order   int  not null default 0,
  created_at   timestamptz default now()
);

create index if not exists project_amenities_project_id_idx on project_amenities(project_id);
create index if not exists project_amenity_images_amenity_id_idx on project_amenity_images(amenity_id);
