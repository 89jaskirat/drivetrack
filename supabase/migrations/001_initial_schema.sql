-- ============================================================
-- DriveTrack Companion — Initial Schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────────────────────
-- One row per auth user. Created automatically on first sign-in via trigger.
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null default '',
  phone       text not null default '',
  email       text not null default '',
  role        text not null default 'driver',
  zone        text not null default 'Calgary',
  units       text not null default 'metric',
  gps_consent boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: own row only"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Mileage Logs ────────────────────────────────────────────────────────────
create table if not exists mileage_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  date        text not null,
  start_odo   real not null default 0,
  end_odo     real not null default 0,
  is_gig_work boolean not null default true,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

alter table mileage_logs enable row level security;

create policy "mileage_logs: own rows only"
  on mileage_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Fuel Logs ───────────────────────────────────────────────────────────────
create table if not exists fuel_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles on delete cascade,
  date       text not null,
  litres     real not null default 0,
  cost       real not null default 0,
  odometer   real not null default 0,
  note       text not null default '',
  created_at timestamptz not null default now()
);

alter table fuel_logs enable row level security;

create policy "fuel_logs: own rows only"
  on fuel_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Expense Logs ────────────────────────────────────────────────────────────
create table if not exists expense_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  date        text not null,
  amount      real not null default 0,
  category    text not null default 'Misc',
  note        text not null default '',
  receipt_url text not null default '',
  hst_amount  real not null default 0,
  created_at  timestamptz not null default now()
);

alter table expense_logs enable row level security;

create policy "expense_logs: own rows only"
  on expense_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Earnings Logs ───────────────────────────────────────────────────────────
create table if not exists earnings_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles on delete cascade,
  date       text not null,
  amount     real not null default 0,
  note       text not null default '',
  platform   text not null default 'Uber',
  created_at timestamptz not null default now()
);

alter table earnings_logs enable row level security;

create policy "earnings_logs: own rows only"
  on earnings_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Shifts ──────────────────────────────────────────────────────────────────
create table if not exists shifts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  start_time  text not null,
  end_time    text,
  start_odo   real not null default 0,
  end_odo     real,
  earnings    real not null default 0,
  distance    real not null default 0,
  duration    integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table shifts enable row level security;

create policy "shifts: own rows only"
  on shifts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Recurring Expenses ──────────────────────────────────────────────────────
create table if not exists recurring_expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles on delete cascade,
  name         text not null,
  amount       real not null default 0,
  category     text not null default 'Misc',
  day_of_month integer not null default 1,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table recurring_expenses enable row level security;

create policy "recurring_expenses: own rows only"
  on recurring_expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Recurring Applied Months ─────────────────────────────────────────────────
create table if not exists recurring_applied_months (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles on delete cascade,
  month_key  text not null,  -- 'YYYY-MM'
  created_at timestamptz not null default now(),
  unique (user_id, month_key)
);

alter table recurring_applied_months enable row level security;

create policy "recurring_applied_months: own rows only"
  on recurring_applied_months for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Community Posts ─────────────────────────────────────────────────────────
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  author_name text not null,
  title       text not null,
  body        text not null default '',
  flair       text not null default '',
  zone        text not null default 'Calgary',
  tags        text[] not null default '{}',
  up_votes    integer not null default 0,
  down_votes  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table posts enable row level security;

-- Any authenticated user can read posts
create policy "posts: authenticated read"
  on posts for select
  using (auth.role() = 'authenticated');

-- Own write only
create policy "posts: own insert"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "posts: own update"
  on posts for update
  using (auth.uid() = user_id);

create policy "posts: own delete"
  on posts for delete
  using (auth.uid() = user_id);

-- ── Comments ────────────────────────────────────────────────────────────────
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts on delete cascade,
  user_id     uuid not null references profiles on delete cascade,
  author_name text not null,
  body        text not null,
  up_votes    integer not null default 0,
  down_votes  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table comments enable row level security;

create policy "comments: authenticated read"
  on comments for select
  using (auth.role() = 'authenticated');

create policy "comments: own insert"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "comments: own update"
  on comments for update
  using (auth.uid() = user_id);

create policy "comments: own delete"
  on comments for delete
  using (auth.uid() = user_id);

-- ── Replies ─────────────────────────────────────────────────────────────────
create table if not exists replies (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid not null references comments on delete cascade,
  user_id     uuid not null references profiles on delete cascade,
  author_name text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table replies enable row level security;

create policy "replies: authenticated read"
  on replies for select
  using (auth.role() = 'authenticated');

create policy "replies: own insert"
  on replies for insert
  with check (auth.uid() = user_id);

create policy "replies: own update"
  on replies for update
  using (auth.uid() = user_id);

create policy "replies: own delete"
  on replies for delete
  using (auth.uid() = user_id);

-- ── Storage Bucket (run separately in Storage section or via SQL) ─────────────
-- In Supabase Dashboard → Storage → New bucket → name: "receipts", Private: ON
-- Then add this policy in Storage → receipts → Policies:
--
-- Policy name: "receipts: own files only"
-- Using expression: (storage.foldername(name))[1] = auth.uid()::text
-- With check: same
-- Allowed operations: SELECT, INSERT, UPDATE, DELETE
