"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  nickname: string | null;
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
};

type PresencePayload = {
  userId?: string;
  nickname?: string;
  onlineAt?: string;
};

export default function MemberSidebar() {
  const [members, setMembers] = useState<Member[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMembers() {
      setLoading(true);
      setError("");

      try {
        const [
          { data: profiles, error: profilesError },
          { data: roles, error: rolesError },
          { data: userRoles, error: userRolesError },
        ] = await Promise.all([
          supabase.from("profiles").select("id, nickname"),
          supabase.from("roles").select("id, name, badge, rank"),
          supabase
            .from("user_roles")
            .select("user_id, role_id, expires_at"),
        ]);

        if (profilesError) throw profilesError;
        if (rolesError) throw rolesError;
        if (userRolesError) throw userRolesError;

        const profileRows = (profiles || []) as ProfileRow[];
        const roleRows = (roles || []) as RoleRow[];
        const userRoleRows = (userRoles || []) as UserRoleRow[];

        const roleMap = new Map(
          roleRows.map((role) => [role.id, role])
        );

        const now = Date.now();

        const formattedMembers: Member[] = profileRows.map(
          (profile) => {
            const validRoles = userRoleRows
              .filter((userRole) => {
                if (userRole.user_id !== profile.id) return false;

                if (!userRole.expires_at) return true;

                return (
                  new Date(userRole.expires_at).getTime() > now
                );
              })
              .map((userRole) => roleMap.get(userRole.role_id))
              .filter(
                (role): role is RoleRow => role !== undefined
              )
              .sort((a, b) => b.rank - a.rank);

            const highestRole = validRoles[0];

            return {
              id: profile.id,
              nickname:
                profile.nickname?.trim() || "Mahlassız Üye",
              roleName: highestRole?.name || "Üye",
              roleBadge: highestRole?.badge || "👤",
              roleRank: highestRole?.rank || 0,
              isOnline: false,
            };
          }
        );

        formattedMembers.sort((a, b) => {
          if (b.roleRank !== a.roleRank) {
            return b.roleRank - a.roleRank;
          }

          return a.nickname.localeCompare(b.nickname, "tr");
        });

        if (active) {
          setMembers(formattedMembers);
        }
      } catch (memberError) {
        console.error("Üyeler alınamadı:", memberError);

        if (active) {
          setError("Üyeler yüklenemedi.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startPresence() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const channel = supabase.channel("haswolf-online-users", {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      function updateOnlineUsers() {
        const presenceState = channel.presenceState<
          PresencePayload
        >();

        const ids = new Set<string>();

        Object.entries(presenceState).forEach(
          ([presenceKey, presenceList]) => {
            ids.add(presenceKey);

            presenceList.forEach((presence) => {
              if (presence.userId) {
                ids.add(presence.userId);
              }
            });
          }
        );

        if (mounted) {
          setOnlineUserIds(ids);
        }
      }

      channel
        .on("presence", { event: "sync" }, updateOnlineUsers)
        .on("presence", { event: "join" }, updateOnlineUsers)
        .on("presence", { event: "leave" }, updateOnlineUsers)
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED") return;

          await channel.track({
            userId: user.id,
            nickname: profile?.nickname || "Kullanıcı",
            onlineAt: new Date().toISOString(),
          });
        });

      return channel;
    }

    let presenceChannel:
      | Awaited<ReturnType<typeof startPresence>>
      | undefined;

    startPresence().then((channel) => {
      presenceChannel = channel;
    });

    return () => {
      mounted = false;

      if (presenceChannel) {
        presenceChannel.untrack();
        supabase.removeChannel(presenceChannel);
      }
    };
  }, []);

  const visibleMembers = members
    .map((member) => ({
      ...member,
      isOnline: onlineUserIds.has(member.id),
    }))
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }

      if (b.roleRank !== a.roleRank) {
        return b.roleRank - a.roleRank;
      }

      return a.nickname.localeCompare(b.nickname, "tr");
    });

  const onlineCount = visibleMembers.filter(
    (member) => member.isOnline
  ).length;

  return (
    <aside className="hidden w-72 shrink-0 border-l border-zinc-800 bg-[#090b0d] xl:block">
      <div className="border-b border-zinc-800 px-5 py-5">
        <h2 className="font-bold text-white">Üyeler</h2>

        <p className="mt-1 text-xs text-zinc-500">
          {onlineCount} çevrim içi · {members.length} üye
        </p>
      </div>

      <div className="h-[calc(100vh-81px)] overflow-y-auto p-3">
        {loading && (
          <p className="px-3 py-4 text-sm text-zinc-500">
            Üyeler yükleniyor...
          </p>
        )}

        {error && (
          <p className="px-3 py-4 text-sm text-red-400">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Çevrim içi — {onlineCount}
            </p>

            <div className="space-y-2">
              {visibleMembers
                .filter((member) => member.isOnline)
                .map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                  />
                ))}
            </div>

            <div className="my-5 border-t border-zinc-800" />

            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Çevrim dışı — {members.length - onlineCount}
            </p>

            <div className="space-y-2">
              {visibleMembers
                .filter((member) => !member.isOnline)
                .map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                  />
                ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function MemberCard({ member }: { member: Member }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-zinc-900 ${
        member.isOnline ? "" : "opacity-50"
      }`}
    >
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d9aa4a] font-black text-black">
          {member.nickname.charAt(0).toUpperCase()}
        </div>

        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#090b0d] ${
            member.isOnline
              ? "bg-green-500"
              : "bg-zinc-600"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-zinc-200">
          {member.nickname}
        </div>

        <div className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500">
          <span>{member.roleBadge}</span>
          <span>{member.roleName}</span>
        </div>
      </div>
    </button>
  );
}