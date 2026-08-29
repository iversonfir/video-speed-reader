-- Cover the jobs.current_session_id foreign key used by transcript downloads.
create index jobs_current_session_id_idx
  on public.jobs (current_session_id)
  where current_session_id is not null;
