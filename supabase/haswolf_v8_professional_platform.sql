begin;

alter table public.profiles add column if not exists community_role text not null default 'member';
alter table public.profiles add column if not exists can_speak boolean not null default false;
alter table public.profiles add column if not exists is_muted boolean not null default false;
alter table public.profiles add column if not exists banned_until timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.moderation_actions(
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check(action in ('kick','ban','mute','unmute','role','speak','delete')),
  reason text not null default '',
  room_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences(
  user_id uuid primary key references auth.users(id) on delete cascade,
  orders boolean not null default true,
  price_alerts boolean not null default true,
  messages boolean not null default true,
  campaigns boolean not null default true,
  favorites boolean not null default true,
  admin_announcements boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.moderation_actions enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "admin moderation actions" on public.moderation_actions;
create policy "admin moderation actions" on public.moderation_actions for all using(public.is_haswolf_admin()) with check(public.is_haswolf_admin());

drop policy if exists "own notification preferences" on public.notification_preferences;
create policy "own notification preferences" on public.notification_preferences for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

create index if not exists moderation_actions_target_idx on public.moderation_actions(target_user_id,created_at desc);
create index if not exists profiles_voice_permission_idx on public.profiles(can_speak,is_muted,banned_until);

commit;

-- Daha önce oluşturulmuş tablolarda yeni "delete" moderasyon işlemini etkinleştirir.
alter table public.moderation_actions drop constraint if exists moderation_actions_action_check;
alter table public.moderation_actions add constraint moderation_actions_action_check
  check(action in ('kick','ban','mute','unmute','role','speak','delete'));
