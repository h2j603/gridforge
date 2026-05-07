-- GridForge v1 schema
-- See GRIDFORGE_SPEC.md §2.1

-- documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  width numeric not null,
  height numeric not null,
  unit text not null check (unit in ('mm','px','pt','in')),
  dpi integer not null default 300,
  orientation text not null check (orientation in ('portrait','landscape')),
  facing_pages boolean not null default false,
  bleed jsonb not null default '{"top":0,"bottom":0,"inside":0,"outside":0}'::jsonb,
  start_page_number integer not null default 1,
  default_margins jsonb not null,
  source_document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- spreads
create table if not exists spreads (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  index integer not null,
  name text,
  unique (document_id, index)
);

-- pages
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  spread_id uuid not null references spreads(id) on delete cascade,
  side text not null check (side in ('left','right','single')),
  margins jsonb,
  unique (spread_id, side)
);

-- grids
create table if not exists grids (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  type text not null check (type in ('columnar','modular','manuscript','custom')),
  cols integer not null check (cols between 1 and 32),
  rows integer not null default 1 check (rows between 1 and 32),
  gutter_x numeric not null default 0,
  gutter_y numeric not null default 0,
  custom_v numeric[] not null default '{}',
  custom_h numeric[] not null default '{}',
  color text not null default 'dark' check (color in ('dark','light')),
  source_grid_id uuid references grids(id) on delete set null,
  unique (page_id)
);

-- baselines
create table if not exists baselines (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  start numeric not null,
  increment numeric not null,
  division integer not null default 4,
  color text not null default 'light' check (color in ('dark','light')),
  unique (page_id)
);

-- slots
create table if not exists slots (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  name text not null,
  role text not null,
  mode text not null check (mode in ('cell','free')),
  col_start integer, col_end integer,
  row_start integer, row_end integer,
  x numeric, y numeric, w numeric, h numeric,
  typography jsonb,
  z_index integer not null default 0,
  notes text
);

-- references
create table if not exists page_references (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  image_url text not null,
  opacity numeric not null default 0.5,
  visible boolean not null default true
);

-- indexes
create index if not exists spreads_document_idx on spreads(document_id);
create index if not exists pages_spread_idx on pages(spread_id);
create index if not exists slots_page_idx on slots(page_id);
create index if not exists grids_source_idx on grids(source_grid_id);
create index if not exists documents_source_idx on documents(source_document_id);

-- grid gallery view: originals only, joined with parent doc info
create or replace view grid_gallery as
select
  g.*,
  p.id as page_id_view,
  d.id as document_id,
  d.name as document_name,
  d.width, d.height, d.unit,
  (select count(*) from grids c where c.source_grid_id = g.id) as descendant_count
from grids g
join pages p on g.page_id = p.id
join spreads s on p.spread_id = s.id
join documents d on s.document_id = d.id
where g.source_grid_id is null;
