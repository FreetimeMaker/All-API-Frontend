alter table public.luma_submissions
  add column if not exists icon_url text,
  add column if not exists version text,
  add column if not exists platform text;

comment on column public.luma_submissions.icon_url is 'Public URL of the application icon.';
comment on column public.luma_submissions.version is 'Developer-supplied application version.';
comment on column public.luma_submissions.platform is 'Target platform, for example Android, Windows, or Linux.';
