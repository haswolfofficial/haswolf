-- HASWOLF V5.5 completion core (run after haswolf_v5_ultimate.sql)
create extension if not exists pgcrypto;

create table if not exists public.guild_members(id uuid primary key default gen_random_uuid(),guild_id uuid not null references public.guilds(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null default 'member' check(role in('owner','leader','officer','member')),joined_at timestamptz not null default now(),unique(guild_id,user_id));
create table if not exists public.guild_invites(id uuid primary key default gen_random_uuid(),guild_id uuid not null references public.guilds(id) on delete cascade,invited_user_id uuid not null references auth.users(id) on delete cascade,invited_by uuid not null references auth.users(id),status text not null default 'pending' check(status in('pending','accepted','rejected','cancelled')),created_at timestamptz not null default now(),responded_at timestamptz,unique(guild_id,invited_user_id,status));
create table if not exists public.room_role_permissions(id uuid primary key default gen_random_uuid(),room_id uuid not null references public.chat_rooms(id) on delete cascade,role text not null,can_read boolean not null default true,can_write boolean not null default true,can_voice boolean not null default true,can_camera boolean not null default false,can_screen_share boolean not null default false,can_upload boolean not null default false,can_pin boolean not null default false,unique(room_id,role));
create table if not exists public.moderation_queue(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete set null,room_id uuid references public.chat_rooms(id) on delete set null,message_id uuid,original_text text,masked_text text,risk_score int not null default 0,reasons text[] not null default '{}',status text not null default 'review',created_at timestamptz not null default now(),reviewed_by uuid references auth.users(id),reviewed_at timestamptz);
create table if not exists public.message_reports(id uuid primary key default gen_random_uuid(),message_id uuid not null,reported_by uuid not null references auth.users(id),reason text not null,status text not null default 'open',created_at timestamptz not null default now(),unique(message_id,reported_by));
create table if not exists public.pinned_messages(id uuid primary key default gen_random_uuid(),room_id uuid not null references public.chat_rooms(id) on delete cascade,message_id uuid not null,pinned_by uuid not null references auth.users(id),created_at timestamptz not null default now(),unique(room_id,message_id));
create table if not exists public.support_tickets(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),subject text not null,status text not null default 'open' check(status in('open','waiting','resolved')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.support_messages(id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.support_tickets(id) on delete cascade,sender_id uuid not null references auth.users(id),message text not null,created_at timestamptz not null default now());
create table if not exists public.user_notifications(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete cascade,type text not null,title text not null,body text,link text,is_read boolean not null default false,created_at timestamptz not null default now(),dedupe_key text);
create unique index if not exists user_notifications_dedupe on public.user_notifications(user_id,dedupe_key) where dedupe_key is not null;
create table if not exists public.product_views(id uuid primary key default gen_random_uuid(),product_id bigint not null references public.products(id) on delete cascade,user_id uuid references auth.users(id) on delete set null,visitor_hash text not null,view_date date not null default current_date,created_at timestamptz not null default now(),unique(product_id,visitor_hash,view_date));
create table if not exists public.product_favorites(user_id uuid not null references auth.users(id) on delete cascade,product_id bigint not null references public.products(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,product_id));
create table if not exists public.product_price_history(id bigint generated always as identity primary key,product_id bigint not null references public.products(id) on delete cascade,price numeric not null,created_at timestamptz not null default now());
create table if not exists public.search_events(id bigint generated always as identity primary key,user_id uuid references auth.users(id),query text not null,results_count int not null default 0,clicked_product_id bigint references public.products(id),created_at timestamptz not null default now());
create table if not exists public.login_events(id bigint generated always as identity primary key,user_id uuid references auth.users(id),success boolean not null,device_hash text,ip_hash text,risk_score int not null default 0,created_at timestamptz not null default now());

alter table public.chat_messages add column if not exists moderation_risk int not null default 0;
alter table public.chat_messages add column if not exists is_hidden boolean not null default false;
alter table public.chat_messages add column if not exists is_pinned boolean not null default false;
alter table public.chat_rooms add column if not exists guild_id uuid references public.guilds(id) on delete cascade;
alter table public.guilds add column if not exists badge_url text;
alter table public.profiles add column if not exists guild_role text;
alter table public.profiles add column if not exists failed_moderation_count int not null default 0;

create or replace function public.accept_guild_invite(p_invite uuid) returns void language plpgsql security definer set search_path=public as $$declare v public.guild_invites;begin select * into v from public.guild_invites where id=p_invite and invited_user_id=auth.uid() and status='pending' for update;if not found then raise exception 'Davet bulunamadı';end if;insert into public.guild_members(guild_id,user_id,role) values(v.guild_id,auth.uid(),'member') on conflict(guild_id,user_id) do nothing;update public.guild_invites set status='accepted',responded_at=now() where id=p_invite;end$$;
create or replace function public.reject_guild_invite(p_invite uuid) returns void language sql security definer set search_path=public as $$update public.guild_invites set status='rejected',responded_at=now() where id=p_invite and invited_user_id=auth.uid() and status='pending'$$;
create or replace function public.expire_premium_memberships() returns int language plpgsql security definer set search_path=public as $$declare n int;begin update public.profiles set premium_tier='normal',premium_until=null where premium_until is not null and premium_until<now() and premium_tier<>'normal';get diagnostics n=row_count;return n;end$$;

alter table public.guild_members enable row level security;alter table public.guild_invites enable row level security;alter table public.room_role_permissions enable row level security;alter table public.moderation_queue enable row level security;alter table public.message_reports enable row level security;alter table public.pinned_messages enable row level security;alter table public.support_tickets enable row level security;alter table public.support_messages enable row level security;alter table public.user_notifications enable row level security;alter table public.product_views enable row level security;alter table public.product_favorites enable row level security;alter table public.product_price_history enable row level security;alter table public.search_events enable row level security;alter table public.login_events enable row level security;

do $$begin
 create policy guild_members_read on public.guild_members for select to authenticated using(user_id=auth.uid() or public.is_admin_member());
 create policy guild_invites_self on public.guild_invites for select to authenticated using(invited_user_id=auth.uid() or invited_by=auth.uid() or public.is_admin_member());
 create policy guild_invites_manage on public.guild_invites for all to authenticated using(invited_by=auth.uid() or public.is_admin_member()) with check(invited_by=auth.uid() or public.is_admin_member());
 create policy room_permissions_read on public.room_role_permissions for select to authenticated using(true);
 create policy room_permissions_admin on public.room_role_permissions for all to authenticated using(public.is_admin_member()) with check(public.is_admin_member());
 create policy moderation_admin on public.moderation_queue for all to authenticated using(public.is_admin_member()) with check(public.is_admin_member());
 create policy reports_own on public.message_reports for insert to authenticated with check(reported_by=auth.uid());
 create policy reports_admin_read on public.message_reports for select to authenticated using(public.is_admin_member() or reported_by=auth.uid());
 create policy pins_read on public.pinned_messages for select to authenticated using(true);
 create policy pins_admin on public.pinned_messages for all to authenticated using(public.is_admin_member()) with check(public.is_admin_member());
 create policy tickets_own on public.support_tickets for all to authenticated using(user_id=auth.uid() or public.is_admin_member()) with check(user_id=auth.uid() or public.is_admin_member());
 create policy support_messages_own on public.support_messages for all to authenticated using(sender_id=auth.uid() or public.is_admin_member() or exists(select 1 from public.support_tickets t where t.id=ticket_id and t.user_id=auth.uid())) with check(sender_id=auth.uid() or public.is_admin_member());
 create policy notifications_own on public.user_notifications for all to authenticated using(user_id is null or user_id=auth.uid() or public.is_admin_member()) with check(user_id=auth.uid() or public.is_admin_member());
 create policy views_insert on public.product_views for insert to anon,authenticated with check(true);
 create policy views_read on public.product_views for select to authenticated using(public.is_admin_member());
 create policy favorites_own on public.product_favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
 create policy price_history_read on public.product_price_history for select to anon,authenticated using(true);
 create policy search_insert on public.search_events for insert to anon,authenticated with check(true);
 create policy search_admin on public.search_events for select to authenticated using(public.is_admin_member());
 create policy login_admin on public.login_events for select to authenticated using(public.is_admin_member());
exception when duplicate_object then null;end$$;
