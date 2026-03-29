create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

alter table groups enable row level security;

create policy "anyone can insert groups"
  on groups for insert
  with check (true);

create policy "anyone can read groups"
  on groups for select
  using (true);

create table members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  nickname text not null,
  session_token text not null unique,
  created_at timestamptz not null default now()
);

alter table members enable row level security;

create policy "anyone can insert members"
  on members for insert
  with check (true);

create policy "anyone can read members"
  on members for select
  using (true);

create table books (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null,
  author text not null,
  thumbnail text,
  registered_at timestamptz not null default now()
);

alter table books enable row level security;

create policy "anyone can insert books"
  on books for insert
  with check (true);

create policy "anyone can read books"
  on books for select
  using (true);
