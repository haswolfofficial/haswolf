"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  nickname: string | null;
  is_guest: boolean | null;
  is_banned: boolean | null;
  banned_until: string | null;
  is_muted: boolean | null;
  muted_until: string | null;
  can_speak: boolean | null;
  community_role: string | null;
};

type RoleRow = { id: string; name: string; badge: string; rank: number };
type UserRoleRow = { user_id: string; role_id: string; expires_at: string | null };

type Member = {
  id: string;
  nickname: string;
  roleName: string;
  roleBadge: string;
  roleRank: number;
  isOnline: boolean;
  isGuest: boolean;
  isBanned: boolean;
  isMuted: boolean;
  canSpeak: boolean;
};

type MemberSidebarProps = {
  currentUserId: string;
  canManageMembers: boolean;
  canChangeNicknames: boolean;
  onlineUserIds: string[];
  activeVoiceRoomName?: string;
};

const MANAGEABLE_ROLES = ["Kurucu", "Yönetici", "Moderatör", "Üye"];

export default function MemberSidebar({
  currentUserId,
  canManageMembers,
  canChangeNicknames,
  onlineUserIds,
  activeVoiceRoomName,
}: MemberSidebarProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onlineSet = useMemo(() => new Set(onlineUserIds), [onlineUserIds]);

  async function loadMembers() {
    setLoading(true);
    setError("");
    try {
      const [{ data: profiles, error: profilesError }, { data: roleData, error: rolesError }, { data: userRoles, error: userRolesError }] = await Promise.all([
        supabase.from("profiles").select("id,nickname,is_guest,is_banned,banned_until,is_muted,muted_until,can_speak,community_role"),
        supabase.from("roles").select("id,name,badge,rank"),
        supabase.from("user_roles").select("user_id,role_id,expires_at"),
      ]);
      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;
      if (userRolesError) throw userRolesError;

      const profileRows = (profiles || []) as ProfileRow[];
      const roleRows = (roleData || []) as RoleRow[];
      const userRoleRows = (userRoles || []) as UserRoleRow[];
      const roleMap = new Map(roleRows.map((role) => [role.id, role]));
      const now = Date.now();
      setRoles(roleRows);

      const formatted = profileRows.map((profile): Member => {
        const highestRole = userRoleRows
          .filter((item) => item.user_id === profile.id && (!item.expires_at || new Date(item.expires_at).getTime() > now))
          .map((item) => roleMap.get(item.role_id))
          .filter((item): item is RoleRow => Boolean(item))
          .sort((a, b) => b.rank - a.rank)[0];
        const timedMute = Boolean(profile.muted_until && new Date(profile.muted_until).getTime() > now);
        const timedBan = Boolean(profile.banned_until && new Date(profile.banned_until).getTime() > now);
        return {
          id: profile.id,
          nickname: profile.nickname?.trim() || "Mahlassız Üye",
          roleName: highestRole?.name || profile.community_role || "Üye",
          roleBadge: highestRole?.badge || "👤",
          roleRank: highestRole?.rank || 0,
          isOnline: onlineSet.has(profile.id),
          isGuest: Boolean(profile.is_guest),
          isBanned: Boolean(profile.is_banned) || timedBan,
          isMuted: Boolean(profile.is_muted) || timedMute,
          canSpeak: Boolean(profile.can_speak),
        };
      });

      formatted.sort((a, b) => a.isOnline === b.isOnline ? (b.roleRank - a.roleRank || a.nickname.localeCompare(b.nickname, "tr")) : a.isOnline ? -1 : 1);
      setMembers(formatted);
    } catch (memberError) {
      console.error(memberError);
      setError(memberError instanceof Error ? memberError.message : "Üyeler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
    const channel = supabase.channel(`member-data-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadMembers())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => void loadMembers())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    setMembers((current) => current.map((member) => ({ ...member, isOnline: onlineSet.has(member.id) })));
  }, [onlineSet]);

  const onlineCount = members.filter((member) => member.isOnline).length;
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;

  function openMember(member: Member) {
    if (!(canManageMembers || canChangeNicknames)) return;
    setSelectedMemberId((current) => current === member.id ? null : member.id);
    setNicknameDraft(member.nickname);
    setError("");
    setSuccess("");
  }

  async function runAction(action: "kick" | "ban" | "mute" | "unmute" | "role" | "speak" | "delete", member: Member, value?: string | boolean) {
    if (!canManageMembers || member.id === currentUserId || saving) return;
    const destructive = action === "ban" || action === "delete";
    if (destructive && !window.confirm(action === "delete" ? `${member.nickname} hesabı kalıcı olarak silinsin mi? Bu işlem geri alınamaz.` : `${member.nickname} banlansın mı?`)) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/member-action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
        body: JSON.stringify({
          action,
          userId: member.id,
          roomName: activeVoiceRoomName,
          participantIdentity: member.id,
          value,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "İşlem tamamlanamadı.");
      setSuccess("İşlem başarıyla uygulandı.");
      await loadMembers();
      if (action === "delete") setSelectedMemberId(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "İşlem tamamlanamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function changeNickname(member: Member) {
    if (!canChangeNicknames || saving) return;
    const nextNickname = nicknameDraft.trim();
    if (nextNickname.length < 2 || nextNickname.length > 24) return setError("Mahlas 2 ile 24 karakter arasında olmalı.");
    setSaving(true); setError(""); setSuccess("");
    const { error: updateError } = await supabase.from("profiles").update({ nickname: nextNickname }).eq("id", member.id);
    if (updateError) setError(updateError.code === "23505" ? "Bu mahlas kullanılıyor." : updateError.message);
    else { setSuccess("Mahlas güncellendi."); await loadMembers(); }
    setSaving(false);
  }

  return (
    <aside className="relative hidden h-full w-[31rem] shrink-0 border-l border-zinc-800 bg-[#090b0d] xl:flex xl:flex-col">
      <div className="shrink-0 border-b border-zinc-800 px-5 py-5">
        <h2 className="font-bold text-white">Üyeler</h2>
        <p className="mt-1 text-xs text-zinc-500">{onlineCount} çevrim içi · {members.length - onlineCount} çevrim dışı · {members.length} üye</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading && <p className="px-3 py-4 text-sm text-zinc-500">Üyeler yükleniyor...</p>}
        {error && !selectedMember && <p className="px-3 py-4 text-sm text-red-400">{error}</p>}
        {!loading && <>
          <MemberSection title={`Çevrim içi — ${onlineCount}`} members={members.filter((m) => m.isOnline)} selectedMemberId={selectedMemberId} mayOpen={canManageMembers || canChangeNicknames} onSelect={openMember} />
          <div className="my-4 border-t border-zinc-800" />
          <MemberSection title={`Çevrim dışı — ${members.length - onlineCount}`} members={members.filter((m) => !m.isOnline)} selectedMemberId={selectedMemberId} mayOpen={canManageMembers || canChangeNicknames} onSelect={openMember} />
        </>}
      </div>
      <YouTubeLiveCard />

      {selectedMember && (canManageMembers || canChangeNicknames) && (
        <div className="fixed right-3 top-20 z-[120] w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#765625] bg-[#111315] shadow-[0_24px_80px_rgba(0,0,0,.7)] xl:right-[31.75rem]">
          <div className="flex items-start justify-between border-b border-zinc-800 p-4">
            <div><p className="font-black text-[#e5b64e]">{selectedMember.nickname}</p><p className="mt-1 text-xs text-zinc-500">{selectedMember.roleBadge} {selectedMember.roleName} · {selectedMember.isOnline ? "Çevrim içi" : "Çevrim dışı"}</p></div>
            <button onClick={() => setSelectedMemberId(null)} className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs">✕</button>
          </div>
          <div className="max-h-[calc(100vh-7rem)] space-y-3 overflow-y-auto p-3">
            {error && <p className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">{error}</p>}
            {success && <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">{success}</p>}
            {canChangeNicknames && <div className="rounded-xl border border-[#765625]/50 bg-black/30 p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#d9aa4a]">Mahlası değiştir</p><input value={nicknameDraft} maxLength={24} onChange={(e) => setNicknameDraft(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[#d9aa4a]"/><button disabled={saving} onClick={() => void changeNickname(selectedMember)} className="mt-2 w-full rounded-lg bg-[#d9aa4a] px-3 py-2 text-xs font-bold text-black disabled:opacity-50">Mahlası kaydet</button></div>}
            {canManageMembers && selectedMember.id !== currentUserId && <>
              <ActionButton label={selectedMember.canSpeak ? "🎙️ Konuşma yetkisini al" : "🎙️ Konuşma yetkisi ver"} onClick={() => void runAction("speak", selectedMember, !selectedMember.canSpeak)} disabled={saving} featured />
              <div className="grid grid-cols-2 gap-2"><ActionButton label={selectedMember.isMuted ? "🔊 Susturmayı kaldır" : "🔇 Sustur"} onClick={() => void runAction(selectedMember.isMuted ? "unmute" : "mute", selectedMember)} disabled={saving}/><ActionButton label="🚪 Kick" onClick={() => void runAction("kick", selectedMember)} disabled={saving}/></div>
              <ActionButton label={selectedMember.isBanned ? "✅ Banı kaldır" : "⛔ Ban"} onClick={() => void runAction("ban", selectedMember, selectedMember.isBanned ? false : true)} disabled={saving} danger={!selectedMember.isBanned}/>
              <p className="px-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Rol ver</p>
              <div className="grid grid-cols-2 gap-2">{MANAGEABLE_ROLES.map((roleName) => <ActionButton key={roleName} label={roleName} onClick={() => void runAction("role", selectedMember, roleName)} disabled={saving}/>)}</div>
              <ActionButton label={selectedMember.isGuest ? "🗑️ Misafir hesabını sil" : "🗑️ Üyeyi kalıcı sil"} onClick={() => void runAction("delete", selectedMember)} disabled={saving} danger />
            </>}
          </div>
        </div>
      )}
    </aside>
  );
}

function ActionButton({ label, onClick, disabled, danger, featured }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; featured?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`w-full rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${danger ? "border-red-500/40 bg-red-950/30 text-red-300 hover:bg-red-950/50" : featured ? "border-[#d9aa4a] bg-[#2b1d07] text-[#ffd875] hover:bg-[#3a2709]" : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-[#d9aa4a]"}`}>{label}</button>;
}

function MemberSection({ title, members, selectedMemberId, mayOpen, onSelect }: { title: string; members: Member[]; selectedMemberId: string | null; mayOpen: boolean; onSelect: (member: Member) => void }) {
  return <section><p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p><div className="space-y-1">{members.map((member) => <button key={member.id} type="button" onClick={() => onSelect(member)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-zinc-900 ${member.isOnline ? "" : "opacity-50"} ${mayOpen ? "cursor-pointer" : "cursor-default"} ${selectedMemberId === member.id ? "bg-zinc-900 ring-1 ring-[#d9aa4a]/40" : ""}`}><div className="relative shrink-0"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d9aa4a] font-black text-black">{member.nickname.charAt(0).toUpperCase()}</div><span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#090b0d] ${member.isOnline ? "bg-green-500" : "bg-zinc-600"}`}/></div><div className="min-w-0 flex-1"><div className="truncate font-semibold text-zinc-200">{member.nickname}</div><div className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500"><span>{member.roleBadge}</span><span>{member.roleName}</span>{member.canSpeak && <span title="Konuşma yetkisi">🎙️</span>}{member.isMuted && <span title="Susturulmuş">🔇</span>}{member.isBanned && <span title="Banlı">🚫</span>}</div></div></button>)}</div></section>;
}

function YouTubeLiveCard() {
  return <div className="shrink-0 border-t border-zinc-800 p-3"><div className="overflow-hidden rounded-2xl border border-red-900/70 bg-[#120708]"><div className="flex items-center justify-between border-b border-red-900/40 bg-[#111315] px-4 py-3"><div><p className="font-bold text-white">HASWOLF TV</p><p className="text-xs text-zinc-500">Royale Online Haswolf</p></div><span className="text-xs text-zinc-500">YAYIN YOK</span></div><div className="flex min-h-44 flex-col items-center justify-center px-4 text-center"><div className="text-4xl">📺</div><p className="mt-4 text-sm text-zinc-400">Bu kanalda canlı yayın başladığında burada otomatik görünecek.</p><a href="https://www.youtube.com/@haswolf" target="_blank" rel="noreferrer" className="mt-4 text-sm font-bold text-red-500 hover:text-red-400">YouTube kanalına git</a></div></div></div>;
}
