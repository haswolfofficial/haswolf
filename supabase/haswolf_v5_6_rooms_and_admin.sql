-- HASWOLF V5.6 - sohbet oda sıralaması ve sunucu ses odaları
begin;

alter table public.chat_rooms add column if not exists sort_order integer not null default 100;
alter table public.chat_rooms add column if not exists kind text not null default 'text';
alter table public.chat_rooms add column if not exists category text not null default 'chat';
alter table public.chat_rooms add column if not exists icon text default '💬';
alter table public.chat_rooms add column if not exists is_active boolean not null default true;

update public.chat_rooms set sort_order=10,category='announcement',kind='text',icon='📢' where slug='news';
update public.chat_rooms set sort_order=20,category='chat',kind='text',icon='💬' where slug='genel';
update public.chat_rooms set sort_order=30,category='chat',kind='text',icon='⚔️' where slug='ephesus';
update public.chat_rooms set sort_order=40,category='chat',kind='text',icon='🛡️' where slug='pergamon';
update public.chat_rooms set sort_order=50,category='chat',kind='text',icon='🔥' where slug='teos';
update public.chat_rooms set sort_order=70,category='trade',kind='text',icon='💰' where slug='trade';

insert into public.chat_rooms(name,slug,icon,kind,category,sort_order,is_active)
values
 ('Ephesus Ses','voice-ephesus','🔊','voice','voice',31,true),
 ('Pergamon Ses','voice-pergamon','🔊','voice','voice',41,true),
 ('Teos Ses','voice-teos','🔊','voice','voice',51,true)
on conflict (slug) do update set name=excluded.name,icon=excluded.icon,kind=excluded.kind,category=excluded.category,sort_order=excluded.sort_order,is_active=true;

update public.chat_rooms set category='guild',kind='voice' where slug like 'voice-guild-%' or (slug like 'voice-%' and guild_name is not null);

commit;
select 'HASWOLF V5.6 oda düzeni tamamlandı' as sonuc;
