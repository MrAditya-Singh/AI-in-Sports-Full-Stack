-- ═══════════════════════════════════════════════════════════════════════════
-- ATHLETIX — Supabase Database Schema
-- Run this in the Supabase SQL Editor for your project.
-- Execute top-to-bottom; tables are ordered by dependency.
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS
--    Core user table — extends Supabase Auth (auth.users).
--    'role' is set at signup and embedded in JWT user_metadata.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text        not null,
  email       text        unique not null,
  role        text        not null check (role in ('athlete', 'official', 'admin')),
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

-- Athletes see only their own row; officials/admins see all
create policy "users: athlete sees own row"
  on public.users for select
  using ( auth.uid() = id );

create policy "users: admin/official sees all"
  on public.users for select
  using ( (select role from public.users where id = auth.uid()) in ('admin', 'official') );

create policy "users: insert own row on signup"
  on public.users for insert
  with check ( auth.uid() = id );

create policy "users: update own row"
  on public.users for update
  using ( auth.uid() = id );


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ATHLETE PROFILES
--    Extended profile for athletes only.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.athlete_profiles (
  user_id          uuid primary key references public.users(id) on delete cascade,
  age              int,
  gender           text,
  location         text,   -- city/state — used for geographic analytics
  bio              text,
  primary_sport    text check (primary_sport in ('powerlifting', 'calisthenics')),
  height_cm        numeric(5,1),
  weight_kg        numeric(5,1),
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced', 'elite'))
);

alter table public.athlete_profiles enable row level security;

create policy "athlete_profiles: athlete sees and edits own"
  on public.athlete_profiles for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "athlete_profiles: official/admin read all"
  on public.athlete_profiles for select
  using ( (select role from public.users where id = auth.uid()) in ('admin', 'official') );


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. VIDEOS
--    One row per uploaded video. Status tracks AI pipeline progress.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid        not null references public.users(id) on delete cascade,
  sport       text        not null check (sport in ('powerlifting', 'calisthenics')),
  exercise    text        not null check (exercise in (
                'squat', 'bench_press', 'deadlift',
                'pushup', 'pullup', 'handstand'
              )),
 video_url   text        not null,
  cloudinary_public_id text,
  duration_seconds double precision NOT NULL DEFAULT 10.0,
  status      text        not null default 'pending'
                check (status in ('pending', 'processing', 'completed', 'failed')),
  error_msg   text,
  uploaded_at timestamptz not null default now()
);
 
alter table public.videos enable row level security;

create policy "videos: athlete sees own"
  on public.videos for select
  using ( auth.uid() = athlete_id );

create policy "videos: athlete inserts own"
  on public.videos for insert
  with check ( auth.uid() = athlete_id );

create policy "videos: official/admin see all completed"
  on public.videos for select
  using (
    (select role from public.users where id = auth.uid()) in ('admin', 'official')
    and status = 'completed'
  );

create policy "videos: admin sees all regardless of status"
  on public.videos for select
  using ( (select role from public.users where id = auth.uid()) = 'admin' );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ASSESSMENTS
--    One row per completed AI analysis. Linked 1:1 to a video.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.assessments (
  id          uuid primary key default gen_random_uuid(),
  video_id    uuid        unique not null references public.videos(id) on delete cascade,
  score       numeric(5,2) not null check (score >= 0 and score <= 100),
  strengths   text[]      not null default '{}',
  weaknesses  text[]      not null default '{}',
  suggestions text[]      not null default '{}',
  rep_count   int,        -- null for powerlifting; int for calisthenics
  created_at  timestamptz not null default now()
);

alter table public.assessments enable row level security;

create policy "assessments: athlete sees own (via video join)"
  on public.assessments for select
  using (
    exists (
      select 1 from public.videos v
      where v.id = video_id and v.athlete_id = auth.uid()
    )
  );

create policy "assessments: official/admin see all"
  on public.assessments for select
  using ( (select role from public.users where id = auth.uid()) in ('admin', 'official') );


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. VERIFICATIONS
--    Official manually verifies an athlete's performance video.
--    Adds a trust badge — does NOT affect leaderboard rank.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.verifications (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid        not null references public.users(id) on delete cascade,
  official_id uuid        not null references public.users(id) on delete cascade,
  video_id    uuid        not null references public.videos(id) on delete cascade,
  exercise    text        not null,
  verified_at timestamptz not null default now(),
  unique (official_id, video_id)   -- one official can only verify a video once
);

alter table public.verifications enable row level security;

create policy "verifications: athlete reads own"
  on public.verifications for select
  using ( auth.uid() = athlete_id );

create policy "verifications: official reads and writes own"
  on public.verifications for all
  using ( auth.uid() = official_id )
  with check ( auth.uid() = official_id );

create policy "verifications: admin sees all"
  on public.verifications for select
  using ( (select role from public.users where id = auth.uid()) = 'admin' );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SHORTLISTS
--    Official shortlists an athlete for further selection.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.shortlists (
  id          uuid primary key default gen_random_uuid(),
  official_id uuid        not null references public.users(id) on delete cascade,
  athlete_id  uuid        not null references public.users(id) on delete cascade,
  sport       text        not null,
  created_at  timestamptz not null default now(),
  unique (official_id, athlete_id, sport)
);

alter table public.shortlists enable row level security;

create policy "shortlists: official manages own"
  on public.shortlists for all
  using ( auth.uid() = official_id )
  with check ( auth.uid() = official_id );

create policy "shortlists: admin sees all"
  on public.shortlists for select
  using ( (select role from public.users where id = auth.uid()) = 'admin' );


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  message    text        not null,
  type       text        not null check (type in (
                  'report_ready', 'verified', 'shortlisted',
                  'verification_pending', 'verification_approved', 'verification_rejected',
                  'general'
                )),
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications: user sees own"
  on public.notifications for all
  using ( auth.uid() = user_id );


-- ─────────────────────────────────────────────────────────────────────────────
-- 7b. PUSH TOKENS
--     Stores Expo push tokens for real-time device notifications.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  token      text        not null,
  platform   text        not null default 'expo',
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

create policy "push_tokens: user manages own"
  on public.push_tokens for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. LEADERBOARD VIEW
--    Derived view — no separate table needed.
--    Ranked by AI score per sport/exercise.
--    is_verified flag derived from verifications table.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.leaderboard_view as
  select
    v.sport,
    v.exercise,
    v.athlete_id,
    u.name                          as athlete_name,
    ap.location                     as athlete_location,
    a.score,
    a.rep_count,
    a.created_at                    as assessed_at,
    rank() over (
      partition by v.sport, v.exercise
      order by a.score desc
    )                               as rank,
    exists (
      select 1
      from public.verifications vr
      where vr.athlete_id = v.athlete_id
        and vr.video_id   = v.id
    )                               as is_verified
  from public.assessments a
  join public.videos v          on a.video_id = v.id
  join public.users u           on v.athlete_id = u.id
  left join public.athlete_profiles ap on ap.user_id = u.id
  where v.status = 'completed';

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- After running this, verify tables appear in Supabase Table Editor.
-- ═══════════════════════════════════════════════════════════════════════════
