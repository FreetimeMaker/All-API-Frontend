alter table public.store_apps
  add column if not exists luma_submission_id uuid unique references public.luma_submissions(id) on delete set null;

create or replace function public.sync_luma_submission_to_store()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_category_id uuid;
  v_developer_name text;
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
      coalesce(new.approved_at, now()),
      now()
    )
    on conflict (luma_submission_id) do update set
      name = excluded.name,
      description = excluded.description,
      developer_name = excluded.developer_name,
      developer_id = excluded.developer_id,
      category_id = excluded.category_id,
      updated_at = now();
  else
    delete from public.store_apps
    where luma_submission_id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_luma_submission_to_store() from public, anon, authenticated;

drop trigger if exists luma_submission_store_sync on public.luma_submissions;
create trigger luma_submission_store_sync
after insert or update of status, name, description, category, user_id
on public.luma_submissions
for each row
execute function public.sync_luma_submission_to_store();

insert into public.store_categories (name)
select distinct btrim(category)
from public.luma_submissions
where status = 'Approved'
  and category is not null
  and btrim(category) <> ''
on conflict (name) do nothing;

insert into public.store_apps (
  luma_submission_id,
  name,
  description,
  developer_name,
  developer_id,
  category_id,
  created_at,
  updated_at
)
select
  s.id,
  s.name,
  s.description,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    nullif(u.raw_user_meta_data ->> 'user_name', ''),
    split_part(u.email, '@', 1),
    'Developer'
  ),
  s.user_id,
  c.id,
  coalesce(s.approved_at, now()),
  now()
from public.luma_submissions s
left join auth.users u on u.id = s.user_id
left join public.store_categories c on c.name = btrim(s.category)
where s.status = 'Approved'
on conflict (luma_submission_id) do update set
  name = excluded.name,
  description = excluded.description,
  developer_name = excluded.developer_name,
  developer_id = excluded.developer_id,
  category_id = excluded.category_id,
  updated_at = now();;
