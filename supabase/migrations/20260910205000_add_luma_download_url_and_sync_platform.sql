-- Add a direct download URL to Luma submissions and sync approved builds
-- into store_app_platforms without breaking legacy submissions.

alter table public.luma_submissions
  add column if not exists download_url text;

comment on column public.luma_submissions.download_url is
  'Direct public download URL for the submitted platform build.';

-- Preserve an existing platform download URL when one already exists.
update public.luma_submissions s
set download_url = sap.download_url
from public.store_apps sa
join public.store_app_platforms sap on sap.app_id = sa.id
where sa.luma_submission_id = s.id
  and s.download_url is null;

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
  if new.status = 'Approved' then
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
  else
    delete from public.store_app_platforms
    where app_id in (
      select id
      from public.store_apps
      where luma_submission_id = new.id
    );

    delete from public.store_apps
    where luma_submission_id = new.id;
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
  download_url
on public.luma_submissions
for each row
execute function public.sync_luma_submission_to_store();

-- Backfill existing approved entries that already have a download URL.
update public.store_app_platforms sap
set
  platform = s.platform,
  download_url = s.download_url
from public.store_apps sa
join public.luma_submissions s on s.id = sa.luma_submission_id
where sap.app_id = sa.id
  and s.status = 'Approved'
  and s.platform is not null
  and btrim(s.platform) <> ''
  and s.download_url is not null
  and btrim(s.download_url) <> '';
