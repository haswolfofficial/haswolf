
-- HASWOLF v4 Community + Notification Upgrade
alter table public.chat_rooms
  add column if not exists icon text not null default '💬',
  add column if not exists kind text not null default 'text',
  add column if not exists category text not null default 'chat',
  add column if not exists guild_name text,
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order integer not null default 100,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.profiles
  add column if not exists forced_room_slug text;

create or replace function public.is_community_manager()
returns boolean language sql stable security definer set search_path=public as $$
  select
    coalesce(auth.jwt()->>'email','') = 'haswolf666@gmail.com'
    or exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id=ur.role_id
      where ur.user_id=auth.uid()
        and (ur.expires_at is null or ur.expires_at > now())
        and lower(r.name) in ('kurucu','yönetici','yonetici')
    );
$$;

insert into public.chat_rooms (name,slug,icon,kind,category,guild_name,is_active,sort_order)
values
 ('ETERNAL Lonca Sohbeti','guild-eternal','🛡️','text','guild','ETERNAL',true,60),
 ('ETERNAL Ses Odası','voice-guild-eternal','🔊','voice','guild','ETERNAL',true,160)
on conflict (slug) do update set
 name=excluded.name, icon=excluded.icon, kind=excluded.kind,
 category=excluded.category, guild_name=excluded.guild_name, is_active=true;

alter table public.chat_rooms enable row level security;

drop policy if exists "chat rooms public read" on public.chat_rooms;
create policy "chat rooms public read" on public.chat_rooms
for select using (is_active=true or public.is_community_manager());

drop policy if exists "chat rooms manager insert" on public.chat_rooms;
create policy "chat rooms manager insert" on public.chat_rooms
for insert with check (public.is_community_manager());

drop policy if exists "chat rooms manager update" on public.chat_rooms;
create policy "chat rooms manager update" on public.chat_rooms
for update using (public.is_community_manager()) with check (public.is_community_manager());

drop policy if exists "chat rooms manager delete" on public.chat_rooms;
create policy "chat rooms manager delete" on public.chat_rooms
for delete using (public.is_community_manager());

drop policy if exists "manager can force room" on public.profiles;
create policy "manager can force room" on public.profiles
for update using (auth.uid()=id or public.is_community_manager())
with check (auth.uid()=id or public.is_community_manager());
