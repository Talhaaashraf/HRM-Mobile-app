-- ═══════════════════════════════════════════════════════════════════════════
-- MJT HR Recruitment — Supabase database schema (free tier is enough)
--
-- How to run:
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
-- Safe to re-run: every statement is idempotent.
--
-- If you created tables earlier by hand (e.g. an old `profiles` table with the
-- 'client' role), uncomment the RESET block below once, then run the file.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── RESET (optional, deletes all app data) ────────────────────────────────
-- drop table if exists public.messages cascade;
-- drop table if exists public.applications cascade;
-- drop table if exists public.jobs cascade;
-- drop table if exists public.profiles cascade;

-- ─── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  role         text not null check (role in ('recruiter', 'candidate')),
  company_name text,
  job_title    text,
  phone        text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  recruiter_id  uuid not null references public.profiles (id) on delete cascade,
  title         text not null,
  company_name  text not null,
  location      text not null,
  type          text not null check (type in ('technical', 'non_technical')),
  description   text not null default '',
  requirements  text[] not null default '{}',
  salary_range  text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs (id) on delete cascade,
  candidate_id  uuid not null references public.profiles (id) on delete cascade,
  cover_note    text,
  resume_url    text, -- storage path inside the `resumes` bucket
  status        text not null default 'applied'
                check (status in ('applied', 'under_review', 'interview', 'rejected', 'hired')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (job_id, candidate_id)
);

-- One chat thread per application (recruiter ⇄ candidate).
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  content         text not null check (length(trim(content)) > 0),
  created_at      timestamptz not null default now()
);

create index if not exists jobs_recruiter_idx on public.jobs (recruiter_id);
create index if not exists applications_job_idx on public.applications (job_id);
create index if not exists applications_candidate_idx on public.applications (candidate_id);
create index if not exists messages_application_idx on public.messages (application_id, created_at);

-- ─── updated_at triggers ───────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- ─── Auto-create a profile on signup ───────────────────────────────────────
-- The app passes role / full_name / company_name as signup metadata. Creating
-- the profile here (instead of from the app) works even while the user's email
-- is still unconfirmed and they have no session yet.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, company_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    case when new.raw_user_meta_data ->> 'role' = 'recruiter' then 'recruiter' else 'candidate' end,
    new.raw_user_meta_data ->> 'company_name'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── RLS helper functions ──────────────────────────────────────────────────
-- SECURITY DEFINER so policies can look across tables without recursing.

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.owns_job(p_job uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.jobs where id = p_job and recruiter_id = auth.uid())
$$;

create or replace function public.has_applied(p_job uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.applications where job_id = p_job and candidate_id = auth.uid())
$$;

create or replace function public.is_application_party(p_app uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.id = p_app and (a.candidate_id = auth.uid() or j.recruiter_id = auth.uid())
  )
$$;

-- True when the other user is connected to me through an application.
create or replace function public.is_connected(p_other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    where (a.candidate_id = p_other and j.recruiter_id = auth.uid())
       or (a.candidate_id = auth.uid() and j.recruiter_id = p_other)
  )
$$;

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table public.profiles     enable row level security;
alter table public.jobs         enable row level security;
alter table public.applications enable row level security;
alter table public.messages     enable row level security;

-- profiles: see yourself and people you are connected to; edit only yourself.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_connected(id));

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Users may not change their own role or email.
revoke update on public.profiles from authenticated;
grant update (full_name, company_name, job_title, phone, avatar_url) on public.profiles to authenticated;

-- jobs: everyone signed in sees open jobs; recruiters manage their own.
drop policy if exists "jobs_select" on public.jobs;
create policy "jobs_select" on public.jobs for select to authenticated
  using (is_active or recruiter_id = auth.uid() or public.has_applied(id));

drop policy if exists "jobs_insert" on public.jobs;
create policy "jobs_insert" on public.jobs for insert to authenticated
  with check (recruiter_id = auth.uid() and public.my_role() = 'recruiter');

drop policy if exists "jobs_update" on public.jobs;
create policy "jobs_update" on public.jobs for update to authenticated
  using (recruiter_id = auth.uid()) with check (recruiter_id = auth.uid());

drop policy if exists "jobs_delete" on public.jobs;
create policy "jobs_delete" on public.jobs for delete to authenticated
  using (recruiter_id = auth.uid());

-- applications: candidates apply and see their own; recruiters see and
-- update status on applications to their jobs.
drop policy if exists "applications_select" on public.applications;
create policy "applications_select" on public.applications for select to authenticated
  using (candidate_id = auth.uid() or public.owns_job(job_id));

drop policy if exists "applications_insert" on public.applications;
create policy "applications_insert" on public.applications for insert to authenticated
  with check (
    candidate_id = auth.uid()
    and public.my_role() = 'candidate'
    and exists (select 1 from public.jobs j where j.id = job_id and j.is_active)
  );

drop policy if exists "applications_update" on public.applications;
create policy "applications_update" on public.applications for update to authenticated
  using (public.owns_job(job_id)) with check (public.owns_job(job_id));

-- Recruiters can only change the status column.
revoke update on public.applications from authenticated;
grant update (status) on public.applications to authenticated;

-- messages: only the two people on an application can read/write its thread.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select to authenticated
  using (public.is_application_party(application_id));

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_application_party(application_id));

-- ─── Realtime (live chat) ──────────────────────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- ─── Storage: private CV bucket ────────────────────────────────────────────
-- Files live at resumes/<candidate-user-id>/<file>.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resumes_insert_own" on storage.objects;
create policy "resumes_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resumes_select" on storage.objects;
create policy "resumes_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'resumes'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.applications a
        join public.jobs j on j.id = a.job_id
        where a.resume_url = storage.objects.name and j.recruiter_id = auth.uid()
      )
    )
  );
