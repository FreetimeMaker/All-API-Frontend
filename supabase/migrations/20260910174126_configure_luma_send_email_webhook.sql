create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

select vault.create_secret(
  encode(gen_random_bytes(32), 'hex'),
  'luma_status_webhook_secret',
  'Secret used by the Send-E-Mail database webhook for Luma submission status notifications'
)
where not exists (
  select 1 from vault.decrypted_secrets where name = 'luma_status_webhook_secret'
);

create or replace function public.send_luma_status_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  webhook_secret text;
  payload jsonb;
begin
  if tg_op = 'UPDATE'
     and new.status is not distinct from old.status
     and new.review_message is not distinct from old.review_message then
    return new;
  end if;

  select decrypted_secret
    into webhook_secret
  from vault.decrypted_secrets
  where name = 'luma_status_webhook_secret'
  limit 1;

  if webhook_secret is null then
    raise warning 'Luma webhook secret is missing from Vault';
    return new;
  end if;

  payload := jsonb_build_object(
    'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    'record', to_jsonb(new),
    'type', tg_op,
    'table', tg_table_name,
    'schema', tg_table_schema
  );

  perform net.http_post(
    url := 'https://dashboard.free-time.me/api/luma/status-webhook',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-luma-webhook-secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

revoke all on function public.send_luma_status_webhook() from public, anon, authenticated;

drop trigger if exists "Send-E-Mail" on public.luma_submissions;
create trigger "Send-E-Mail"
after insert or update on public.luma_submissions
for each row
execute function public.send_luma_status_webhook();;
