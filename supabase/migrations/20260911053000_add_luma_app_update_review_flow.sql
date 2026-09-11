-- Allow developers to submit updates for already approved Luma apps.
-- The currently published store version remains available while the update is reviewed.

alter table public.luma_submissions
  add column if not exists changelog text;

comment on column public.luma_submissions.changelog is
  'Required changelog when an already approved app is submitted as an update for review.';

-- Approved apps can be moved back to Pending by their owner, but only with
-- the required update metadata and changelog.
drop policy if exists "Users can update approved submissions" on public.luma_submissions;

create policy "Users can update approved submissions"
on public.luma_submissions
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and status = 'Approved'
)
with check (
  (select auth.uid()) = user_id
  and status = 'Pending'
  and changelog is not null
  and btrim(changelog) <> ''
  and version is not null
  and btrim(version) <> ''
  and download_url is not null
  and btrim(download_url) <> ''
  and platform is not null
  and btrim(platform) <> ''
);

-- Keep the last approved Store listing while a new version is Pending,
-- In Review, or Rejected. Only a new Approved state overwrites the published
-- Store metadata. This means users never lose the currently published build
-- while an update is being reviewed.
create or replace function public.sync_luma_submission_to_store()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_category_id uuid;
  v_developer_name text;
  v_store_app_id uuid;
  v_platform_rows integer;
begin
  if new.status <> 'Approved' then
    return new;
  end if;

  if new.category is not null and btrim(new.category) <> '' then
    insert into public.store_categories (name)
    values (btrim(new.category))
    on conflict (name) do update set name = excluded.name
    returning id into v_category_id;
  else
    v_category_id := null;
  end if;

  select coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(raw_user_meta_data ->> 'name', ''),
    nullif(raw_user_meta_data ->> 'user_name', ''),
    split_part(email, '@', 1),
    'Developer'
  )
  into v_developer_name
  from auth.users
  where id = new.user_id;

  insert into public.store_apps (
    luma_submission_id,
    name,
    description,
    developer_name,
    developer_id,
    category_id,
    icon_url,
    version,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.name,
    new.description,
    coalesce(v_developer_name, 'Developer'),
    new.user_id,
    v_category_id,
    new.icon_url,
    new.version,
    coalesce(new.approved_at, now()),
    now()
  )
  on conflict (luma_submission_id) do update set
    name = excluded.name,
    description = excluded.description,
    developer_name = excluded.developer_name,
    developer_id = excluded.developer_id,
    category_id = excluded.category_id,
    icon_url = excluded.icon_url,
    version = excluded.version,
    updated_at = now()
  returning id into v_store_app_id;

  if new.platform is not null
     and btrim(new.platform) <> ''
     and new.download_url is not null
     and btrim(new.download_url) <> '' then

    update public.store_app_platforms
    set
      platform = btrim(new.platform),
      download_url = btrim(new.download_url)
    where app_id = v_store_app_id;

    get diagnostics v_platform_rows = row_count;

    if v_platform_rows = 0 then
      insert into public.store_app_platforms (app_id, platform, download_url)
      values (v_store_app_id, btrim(new.platform), btrim(new.download_url));
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_luma_submission_to_store()
  from public, anon, authenticated;

drop trigger if exists luma_submission_store_sync
  on public.luma_submissions;

create trigger luma_submission_store_sync
after insert or update of
  status,
  name,
  description,
  category,
  user_id,
  icon_url,
  version,
  platform,
  download_url,
  changelog
on public.luma_submissions
for each row
execute function public.sync_luma_submission_to_store();
