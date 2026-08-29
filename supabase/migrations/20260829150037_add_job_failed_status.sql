alter table public.jobs
  drop constraint jobs_status_check;

alter table public.jobs
  add constraint jobs_status_check
  check (status in ('pending', 'downloading', 'transcribe', 'done', 'failed'));
