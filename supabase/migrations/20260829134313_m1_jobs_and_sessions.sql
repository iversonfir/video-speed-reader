-- M1 schema: jobs + job_sessions (TXT-only, no SRT/VTT/reviewed).

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  video_source_url text not null,
  topic text,
  language text not null default 'zh',
  status text not null default 'pending'
    check (status in ('pending', 'downloading', 'transcribe', 'done')),
  current_session_id uuid
);

create table public.job_sessions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  session_number integer not null default 1,
  created_at timestamptz not null default now(),
  subtitle_txt_content text
);

alter table public.jobs
  add constraint fk_current_session
  foreign key (current_session_id) references public.job_sessions(id);

create index jobs_user_id_created_at_idx
  on public.jobs (user_id, created_at desc);

create index job_sessions_job_id_idx
  on public.job_sessions (job_id);

alter table public.jobs enable row level security;
alter table public.job_sessions enable row level security;

revoke all on table public.jobs from anon, authenticated;
revoke all on table public.job_sessions from anon, authenticated;
grant select, insert on table public.jobs to authenticated;
grant select on table public.job_sessions to authenticated;

create policy "users read own jobs" on public.jobs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users insert own jobs" on public.jobs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users read own sessions" on public.job_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = job_id
        and j.user_id = (select auth.uid())
    )
  );
