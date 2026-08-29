alter table public.jobs
  add column transcript_format text not null default 'sentences'
  check (transcript_format in ('sentences', 'timestamps'));

