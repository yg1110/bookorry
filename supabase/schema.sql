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

create table reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  content text not null,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "anyone can insert reviews"
  on reviews for insert
  with check (true);

create policy "anyone can read reviews"
  on reviews for select
  using (true);

create table review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index review_comments_review_id_idx on review_comments(review_id);

alter table review_comments enable row level security;

create policy "anyone can insert review_comments"
  on review_comments for insert
  with check (true);

create policy "anyone can read review_comments"
  on review_comments for select
  using (true);

-- Storage bucket for routine photos
insert into storage.buckets (id, name, public)
values ('routine-photos', 'routine-photos', true)
on conflict (id) do nothing;

create policy "anyone can upload routine photos"
  on storage.objects for insert
  with check (bucket_id = 'routine-photos');

create policy "anyone can read routine photos"
  on storage.objects for select
  using (bucket_id = 'routine-photos');

-- Routine logs table
create table routine_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  type text not null check (type in ('gym', 'reading', 'diet', 'duolingo', 'self_dev', 'skin_care', 'online_lecture', 'running')),
  photo_url text,
  photo_urls text[] not null default '{}',
  text_content text,
  review_id uuid references reviews(id) on delete set null,
  log_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index routine_logs_group_date_idx on routine_logs(group_id, log_date);

alter table routine_logs enable row level security;

create policy "anyone can insert routine_logs"
  on routine_logs for insert
  with check (true);

create policy "anyone can read routine_logs"
  on routine_logs for select
  using (true);

create policy "anyone can update routine_logs"
  on routine_logs for update
  using (true);

create policy "anyone can delete routine_logs"
  on routine_logs for delete
  using (true);

-- Per-member routine requirements
create table member_routine_requirements (
  member_id uuid not null references members(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  routine_type text not null,
  -- 0 = 선택(optional), 1-6 = 주N일, 7 = 매일
  weekly_target int not null default 1 check (weekly_target >= 0 and weekly_target <= 7),
  primary key (member_id, routine_type)
);

alter table member_routine_requirements enable row level security;

create policy "anyone can read member_routine_requirements"
  on member_routine_requirements for select using (true);

create policy "anyone can insert member_routine_requirements"
  on member_routine_requirements for insert with check (true);

create policy "anyone can update member_routine_requirements"
  on member_routine_requirements for update using (true);

create policy "anyone can delete member_routine_requirements"
  on member_routine_requirements for delete using (true);
  
  ALTER TABLE routine_logs
    DROP CONSTRAINT IF EXISTS routine_logs_type_check;                                                                                                             
   
      ALTER TABLE routine_logs DROP CONSTRAINT IF EXISTS routine_logs_type_check;                                                                                      
  ALTER TABLE routine_logs ADD CONSTRAINT routine_logs_type_check                                                                                                
    CHECK (type IN ('gym', 'reading', 'diet', 'duolingo', 'self_dev', 'skin_care', 'online_lecture'));   