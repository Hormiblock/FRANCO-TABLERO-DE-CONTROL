-- =============================================
-- FRANCO TABLERO DE CONTROL — Schema completo
-- =============================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ── PERFILES DE USUARIO ──────────────────────
create table perfiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  nombre      text not null,
  rol         text not null check (rol in ('admin', 'gerente')),
  empresas    text[] default '{}',   -- ['hormiblock','blockera'] etc.
  whatsapp    text default '',
  email       text default '',
  avatar      text default '',
  created_at  timestamptz default now()
);

alter table perfiles enable row level security;

-- Admin ve todos los perfiles, gerentes solo el suyo
create policy "Admin ve todo" on perfiles
  for all using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );
create policy "Gerente ve su perfil" on perfiles
  for select using (id = auth.uid());

-- ── TAREAS ───────────────────────────────────
create table tareas (
  id           uuid default uuid_generate_v4() primary key,
  titulo       text not null,
  descripcion  text default '',
  empresa      text not null check (empresa in ('ostara','hormiblock','blockera','granny')),
  estado       text not null default 'pendiente' check (estado in ('pendiente','en_curso','bloqueado','completado')),
  prioridad    text not null default 'media' check (prioridad in ('alta','media','baja')),
  asignado_a   uuid references perfiles(id),   -- null = Franco directamente
  creado_por   uuid references perfiles(id),
  fecha_limite date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table tareas enable row level security;

-- Admin ve y modifica todas
create policy "Admin full access tareas" on tareas
  for all using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );
-- Gerente ve solo las tareas de sus empresas o asignadas a él
create policy "Gerente ve sus tareas" on tareas
  for select using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid()
        and p.rol = 'gerente'
        and (empresa = any(p.empresas) or asignado_a = auth.uid())
    )
  );
-- Gerente puede actualizar estado de sus tareas
create policy "Gerente actualiza estado" on tareas
  for update using (asignado_a = auth.uid())
  with check (asignado_a = auth.uid());

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tareas_updated_at
  before update on tareas
  for each row execute function update_updated_at();

-- ── BAJADAS DE LÍNEA ─────────────────────────
create table bajadas (
  id           uuid default uuid_generate_v4() primary key,
  titulo       text not null,
  descripcion  text default '',
  empresa      text not null check (empresa in ('ostara','hormiblock','blockera','granny')),
  prioridad    text not null default 'media' check (prioridad in ('alta','media','baja')),
  estado       text not null default 'pendiente' check (estado in ('pendiente','en_curso','completado')),
  gerente_id   uuid references perfiles(id) not null,
  enviado_por  text default 'ninguno' check (enviado_por in ('whatsapp','email','ninguno')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table bajada_pasos (
  id         uuid default uuid_generate_v4() primary key,
  bajada_id  uuid references bajadas(id) on delete cascade,
  orden      integer not null,
  texto      text not null,
  completado boolean default false
);

alter table bajadas enable row level security;
alter table bajada_pasos enable row level security;

create policy "Admin full access bajadas" on bajadas
  for all using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );
create policy "Gerente ve sus bajadas" on bajadas
  for select using (gerente_id = auth.uid());
create policy "Gerente actualiza estado bajada" on bajadas
  for update using (gerente_id = auth.uid())
  with check (gerente_id = auth.uid());

create policy "Admin full access pasos" on bajada_pasos
  for all using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );
create policy "Gerente ve sus pasos" on bajada_pasos
  for select using (
    exists (select 1 from bajadas b where b.id = bajada_id and b.gerente_id = auth.uid())
  );
create policy "Gerente tilda sus pasos" on bajada_pasos
  for update using (
    exists (select 1 from bajadas b where b.id = bajada_id and b.gerente_id = auth.uid())
  );

create trigger bajadas_updated_at
  before update on bajadas
  for each row execute function update_updated_at();

-- ── EVENTOS / CALENDARIO ─────────────────────
create table eventos (
  id          uuid default uuid_generate_v4() primary key,
  titulo      text not null,
  empresa     text not null check (empresa in ('ostara','hormiblock','blockera','granny')),
  fecha       date not null,
  hora        time,
  tipo        text default 'reunion' check (tipo in ('reunion','deadline','evento','visita')),
  descripcion text default '',
  created_at  timestamptz default now()
);

alter table eventos enable row level security;

create policy "Admin full access eventos" on eventos
  for all using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );
create policy "Gerente ve eventos de sus empresas" on eventos
  for select using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol = 'gerente' and empresa = any(p.empresas)
    )
  );

-- ── LICITACIONES ─────────────────────────────
create table licitaciones (
  id           uuid default uuid_generate_v4() primary key,
  titulo       text not null,
  descripcion  text default '',
  empresa      text not null check (empresa in ('ostara','hormiblock','blockera','granny')),
  fecha_cierre date not null,
  monto        text default '',
  estado       text default 'activa' check (estado in ('activa','cerrada','adjudicada','perdida')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table licitaciones enable row level security;

create policy "Admin full access licitaciones" on licitaciones
  for all using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );
create policy "Gerente ve licitaciones de sus empresas" on licitaciones
  for select using (
    exists (
      select 1 from perfiles p
      where p.id = auth.uid() and p.rol = 'gerente' and empresa = any(p.empresas)
    )
  );

create trigger licitaciones_updated_at
  before update on licitaciones
  for each row execute function update_updated_at();

-- ── DATOS INICIALES ──────────────────────────
-- Nota: los usuarios se crean desde Auth → luego se insertan perfiles
-- Correr esto DESPUÉS de crear los usuarios en Supabase Auth:

-- insert into perfiles (id, nombre, rol, empresas, avatar) values
--   ('<UUID-franco>',   'Franco Manzone', 'admin',   '{"ostara","hormiblock","blockera","granny"}', 'FM'),
--   ('<UUID-jose>',     'Jose Sparks',    'gerente', '{"hormiblock","blockera"}',                   'JS'),
--   ('<UUID-santiago>', 'Santiago Dans',  'gerente', '{"granny"}',                                  'SD');
