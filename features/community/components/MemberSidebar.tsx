"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  nickname: string | null;
  is_banned: boolean | null;
  is_muted: boolean | null;
  muted_until: string | null;
};

type RoleRow = {
  id: string;
  name: string;
  badge: string;
  rank: number;
};

type UserRoleRow = {
  user_id: string;
  role_id: string;
  expires_at: string | null;
};

type Member = {
  id: string;
  nickname: string;
  roleName: string;
  roleBadge: string;
  roleRank: number;
  isOnline: boolean;
  isBanned: boolean;
  isMuted: boolean;
  mutedUntil: string | null;
};

type MemberSidebarProps = {
  currentUserId: string;
  canManageMembers: boolean;
  canChangeNicknames: boolean;
  onlineUserIds: string[];
};

const MANAGEABLE_ROLES = ["Kurucu", "Yönetici", "Moderatör", "Üye"];

export default function MemberSidebar({
  currentUserId,
  canManageMembers,
  canChangeNicknames,
  onlineUserIds,
}: MemberSidebarProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onlineSet = useMemo(() => new Set(onlineUserIds), [onlineUserIds]);

  async function loadMembers() {
    setLoading(true);
    setError("");

    try {
      const [
        { data: profiles, error: profilesError },
        { data: roleData, error: rolesError },
        { data: userRoles, error: userRolesError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,nickname,is_banned,is_muted,muted_until"),
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

      const formattedMembers: Member[] = profileRows.map((profile) => {
        const validRoles = userRoleRows
          .filter((userRole) => {
            if (userRole.user_id !== profile.id) return false;
            if (!userRole.expires_at) return true;
            return new Date(userRole.expires_at).getTime() > now;
          })
          .map((userRole) => roleMap.get(userRole.role_id))
          .filter((role): role is RoleRow => role !== undefined)
          .sort((a, b) => b.rank - a.rank);

        const highestRole = validRoles[0];
        const timedMuteActive =
          !!profile.muted_until &&
          new Date(profile.muted_until).getTime() > Date.now();

        return {
          id: profile.id,
          nickname: profile.nickname?.trim() || "Mahlassız Üye",
          roleName: highestRole?.name || "Üye",
          roleBadge: highestRole?.badge || "👤",
          roleRank: highestRole?.rank || 0,
          isOnline: onlineSet.has(profile.id),
          isBanned: Boolean(profile.is_banned),
          isMuted: Boolean(profile.is_muted) || timedMuteActive,
          mutedUntil: profile.muted_until,
        };
      });

      formattedMembers.sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        if (b.roleRank !== a.roleRank) return b.roleRank - a.roleRank;
        return a.nickname.localeCompare(b.nickname, "tr");
      });

      setMembers(formattedMembers);
    } catch (memberError) {
      console.error("Üyeler alınamadı:", memberError);
      setError("Üyeler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();

    const channel = supabase
      .channel(`member-data-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => void loadMembers()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => void loadMembers()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setMembers((current) =>
      current
        .map((member) => ({ ...member, isOnline: onlineSet.has(member.id) }))
        .sort((a, b) => {
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          if (b.roleRank !== a.roleRank) return b.roleRank - a.roleRank;
          return a.nickname.localeCompare(b.nickname, "tr");
        })
    );
  }, [onlineSet]);

  const onlineCount = members.filter((member) => member.isOnline).length;
  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ?? null;

  function openMember(member: Member) {
    const mayOpen = canManageMembers || canChangeNicknames;
    if (!mayOpen) return;
    setSelectedMemberId((current) => (current === member.id ? null : member.id));
    setNicknameDraft(member.nickname);
    setError("");
  }

  async function changeNickname(member: Member) {
    if (!canChangeNicknames || saving) return;

    const nextNickname = nicknameDraft.trim();
    if (nextNickname.length < 2 || nextNickname.length > 24) {
      setError("Mahlas 2 ile 24 karakter arasında olmalı.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ nickname: nextNickname })
      .eq("id", member.id);

    if (updateError) {
      setError(
        updateError.code === "23505"
          ? "Bu mahlas başka bir kullanıcı tarafından kullanılıyor."
          : updateError.message
      );
    } else {
      await loadMembers();
      setSelectedMemberId(null);
    }

    setSaving(false);
  }

  async function assignRole(member: Member, roleName: string) {
    if (!canManageMembers || member.id === currentUserId || saving) return;

    const role = roles.find((item) => item.name === roleName);
    if (!role) {
      setError(`${roleName} rolü veritabanında bulunamadı.`);
      return;
    }

    setSaving(true);
    setError("");

    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", member.id);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("user_roles").insert({
      user_id: member.id,
      role_id: role.id,
      expires_at: null,
    });

    if (insertError) setError(insertError.message);
    else {
      await loadMembers();
      setSelectedMemberId(null);
    }

    setSaving(false);
  }

  async function muteMember(member: Member, minutes: number | null) {
    if (!canManageMembers || member.id === currentUserId || saving) return;

    setSaving(true);
    setError("");
    const mutedUntil =
      minutes === null ? null : new Date(Date.now() + minutes * 60_000).toISOString();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_muted: true, muted_until: mutedUntil })
      .eq("id", member.id);

    if (updateError) setError(updateError.message);
    else {
      await loadMembers();
      setSelectedMemberId(null);
    }
    setSaving(false);
  }

  async function unmuteMember(member: Member) {
    if (!canManageMembers || member.id === currentUserId || saving) return;

    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_muted: false, muted_until: null })
      .eq("id", member.id);

    if (updateError) setError(updateError.message);
    else {
      await loadMembers();
      setSelectedMemberId(null);
    }
    setSaving(false);
  }

  async function toggleBan(member: Member) {
    if (!canManageMembers || member.id === currentUserId || saving) return;

    const action = member.isBanned ? "banı kaldırılsın" : "banlansın";
    if (!window.confirm(`${member.nickname} ${action} mı?`)) return;

    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_banned: !member.isBanned })
      .eq("id", member.id);

    if (updateError) setError(updateError.message);
    else {
      await loadMembers();
      setSelectedMemberId(null);
    }
    setSaving(false);
  }

  return (
    <aside className="hidden h-full w-[31rem] shrink-0 border-l border-zinc-800 bg-[#090b0d] xl:flex xl:flex-col">
      <div className="shrink-0 border-b border-zinc-800 px-5 py-5">
        <h2 className="font-bold text-white">Üyeler</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {onlineCount} çevrim içi · {members.length - onlineCount} çevrim dışı · {members.length} üye
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading && <p className="px-3 py-4 text-sm text-zinc-500">Üyeler yükleniyor...</p>}
        {error && <p className="px-3 py-4 text-sm text-red-400">{error}</p>}

        {!loading && (
          <>
            <MemberSection
              title={`Çevrim içi — ${onlineCount}`}
              members={members.filter((member) => member.isOnline)}
              selectedMemberId={selectedMemberId}
              mayOpen={canManageMembers || canChangeNicknames}
              onSelect={openMember}
            />

            <div className="my-4 border-t border-zinc-800" />

            <MemberSection
              title={`Çevrim dışı — ${members.length - onlineCount}`}
              members={members.filter((member) => !member.isOnline)}
              selectedMemberId={selectedMemberId}
              mayOpen={canManageMembers || canChangeNicknames}
              onSelect={openMember}
            />
          </>
        )}
      </div>

      <YouTubeLiveCard />

      {selectedMember && (canManageMembers || canChangeNicknames) && (
        <div className="absolute right-[31rem] top-20 z-50 w-72 overflow-hidden rounded-xl border border-[#765625] bg-[#111315] shadow-2xl">
          <div className="border-b border-zinc-800 p-4">
            <p className="font-bold text-[#e5b64e]">{selectedMember.nickname}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {selectedMember.roleBadge} {selectedMember.roleName}
              {selectedMember.isOnline ? " · Çevrim içi" : " · Çevrim dışı"}
            </p>
          </div>

          <div className="max-h-[72vh] space-y-3 overflow-y-auto p-3">
            {canChangeNicknames && (
              <div className="rounded-lg border border-[#765625]/50 bg-black/30 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#d9aa4a]">
                  Mahlası değiştir
                </p>
                <input
                  value={nicknameDraft}
                  maxLength={24}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[#d9aa4a]"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => changeNickname(selectedMember)}
                  className="mt-2 w-full rounded-lg bg-[#d9aa4a] px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                >
                  Mahlası kaydet
                </button>
              </div>
            )}

            {canManageMembers && selectedMember.id !== currentUserId && (
              <>
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Rol ver</p>
                <div className="grid grid-cols-2 gap-2">
                  {MANAGEABLE_ROLES.map((roleName) => (
                    <button
                      key={roleName}
                      type="button"
                      disabled={saving}
                      onClick={() => assignRole(selectedMember, roleName)}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs hover:border-[#d9aa4a]"
                    >
                      {roleName}
                    </button>
                  ))}
                </div>

                <p className="px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Susturma</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => muteMember(selectedMember, 10)} className="rounded-lg bg-zinc-800 px-2 py-2 text-xs">10 dakika</button>
                  <button onClick={() => muteMember(selectedMember, 60)} className="rounded-lg bg-zinc-800 px-2 py-2 text-xs">1 saat</button>
                  <button onClick={() => muteMember(selectedMember, 1440)} className="rounded-lg bg-zinc-800 px-2 py-2 text-xs">24 saat</button>
                  <button onClick={() => muteMember(selectedMember, null)} className="rounded-lg bg-zinc-800 px-2 py-2 text-xs">Süresiz</button>
                </div>

                {selectedMember.isMuted && (
                  <button onClick={() => unmuteMember(selectedMember)} className="w-full rounded-lg border border-emerald-500/40 px-3 py-2 text-xs text-emerald-300">
                    Susturmayı kaldır
                  </button>
                )}

                <button onClick={() => toggleBan(selectedMember)} className="w-full rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                  {selectedMember.isBanned ? "Banı kaldır" : "Kullanıcıyı banla"}
                </button>
              </>
            )}

            <button onClick={() => setSelectedMemberId(null)} className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400">
              Kapat
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function MemberSection({
  title,
  members,
  selectedMemberId,
  mayOpen,
  onSelect,
}: {
  title: string;
  members: Member[];
  selectedMemberId: string | null;
  mayOpen: boolean;
  onSelect: (member: Member) => void;
}) {
  return (
    <section>
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="space-y-1">
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-zinc-900 ${
              member.isOnline ? "" : "opacity-50"
            } ${mayOpen ? "cursor-pointer" : "cursor-default"} ${
              selectedMemberId === member.id ? "bg-zinc-900 ring-1 ring-[#d9aa4a]/40" : ""
            }`}
          >
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d9aa4a] font-black text-black">
                {member.nickname.charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#090b0d] ${
                  member.isOnline ? "bg-green-500" : "bg-zinc-600"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-zinc-200">{member.nickname}</div>
              <div className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500">
                <span>{member.roleBadge}</span>
                <span>{member.roleName}</span>
                {member.isMuted && <span title="Susturulmuş">🔇</span>}
                {member.isBanned && <span title="Banlı">🚫</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function YouTubeLiveCard() {
  const [live, setLive] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    async function checkLive() {
      try {
        const response = await fetch("/api/youtube-live", { cache: "no-store" });
        const data = (await response.json()) as { live?: boolean; videoId?: string | null };
        setLive(Boolean(data.live));
        setVideoId(data.videoId ?? null);
      } catch {
        setLive(false);
        setVideoId(null);
      }
    }

    void checkLive();
    const timer = window.setInterval(checkLive, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const channelUrl = "https://www.youtube.com/@ROYALEONLINEHASWOLF/live";

  return (
    <div className="shrink-0 border-t border-zinc-800 p-3">
      <div className="overflow-hidden rounded-2xl border border-red-500/40 bg-[#111315] shadow-[0_0_30px_rgba(127,29,29,0.18)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-black text-white">HASWOLF TV</p>
            <p className="text-xs text-zinc-500">Royale Online Haswolf</p>
          </div>
          <span className={live ? "text-sm font-bold text-red-400" : "text-xs text-zinc-500"}>
            {live ? "🔴 CANLI YAYIN" : "YAYIN YOK"}
          </span>
        </div>

        {live && videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
            title="HASWOLF canlı yayın"
            className="aspect-video min-h-[260px] w-full bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex min-h-[190px] items-center justify-center bg-gradient-to-br from-red-950/50 to-black px-6 text-center">
            <div>
              <div className="text-5xl">📺</div>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                Bu kanalda canlı yayın başladığında burada otomatik görünecek.
              </p>
            </div>
          </div>
        )}

        <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="block border-t border-zinc-800 px-4 py-3 text-center text-sm font-bold text-red-400 hover:bg-red-950/30">
          YouTube kanalına git
        </a>
      </div>
    </div>
  );
}
