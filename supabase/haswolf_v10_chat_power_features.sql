begin;

alter table public.chat_messages
  add column if not exists reply_to_id uuid references public.chat_messages(id) on delete set null;

create index if not exists chat_messages_reply_to_idx
  on public.chat_messages(reply_to_id);

create table if not exists public.chat_message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default 'Diğer',
  status text not null default 'open' check (status in ('open','reviewed','dismissed','actioned')),
  created_at timestamptz not null default now(),
  unique(message_id, reporter_id)
);

alter table public.chat_message_reports enable row level security;

drop policy if exists "chat reports own insert" on public.chat_message_reports;
create policy "chat reports own insert"
on public.chat_message_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "chat reports own read" on public.chat_message_reports;
create policy "chat reports own read"
on public.chat_message_reports
for select
to authenticated
using (reporter_id = auth.uid() or public.is_admin_member());

drop policy if exists "chat reports admin manage" on public.chat_message_reports;
create policy "chat reports admin manage"
on public.chat_message_reports
for update
to authenticated
using (public.is_admin_member())
with check (public.is_admin_member());

create index if not exists chat_message_reports_status_idx
  on public.chat_message_reports(status, created_at desc);

create or replace function public.haswolf_chat_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ten_second_count integer;
  minute_count integer;
begin
  if new.user_id is null then
    return new;
  end if;

  select count(*) into ten_second_count
  from public.chat_messages
  where user_id = new.user_id
    and created_at >= now() - interval '10 seconds';

  if ten_second_count >= 5 then
    raise exception 'RATE_LIMIT_FAST';
  end if;

  select count(*) into minute_count
  from public.chat_messages
  where user_id = new.user_id
    and created_at >= now() - interval '60 seconds';

  if minute_count >= 25 then
    raise exception 'RATE_LIMIT_MINUTE';
  end if;

  return new;
end;
$$;

drop trigger if exists haswolf_chat_rate_limit_trigger on public.chat_messages;
create trigger haswolf_chat_rate_limit_trigger
before insert on public.chat_messages
for each row execute function public.haswolf_chat_rate_limit();

commit;