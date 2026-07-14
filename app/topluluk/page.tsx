"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CommunityLayout from "@/features/community/components/CommunityLayout";

const ADMIN_EMAIL = "haswolf666@gmail.com";
const MANAGER_ROLES = new Set(["Kurucu", "Yönetici"]);

type RoleRow = {
  id: string;
  name: string;
};

export default function ToplulukPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [canChangeNicknames, setCanChangeNicknames] = useState(false);
  const [banned, setBanned] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function checkProfile() {
      setLoadError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setLoadError(authError.message);
        setReady(true);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("nickname,is_banned")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profil alınamadı:", error);
        setLoadError(error.message);
        setReady(true);
        return;
      }

      if (profile?.is_banned) {
        setBanned(true);
        setReady(true);
        return;
      }

      const userNickname = profile?.nickname?.trim();
      if (!userNickname) {
        router.replace("/mahlas");
        return;
      }

      let managerByRole = false;
      let founderByRole = false;

      const { data: userRoleRows, error: userRolesError } = await supabase
        .from("user_roles")
        .select("role_id,expires_at")
        .eq("user_id", user.id);

      if (userRolesError) {
        setLoadError(userRolesError.message);
        setReady(true);
        return;
      }

      const validRoleIds = (userRoleRows || [])
        .filter((row) => {
          if (!row.expires_at) return true;
          return new Date(row.expires_at).getTime() > Date.now();
        })
        .map((row) => row.role_id);

      if (validRoleIds.length > 0) {
        const { data: roleRows, error: rolesError } = await supabase
          .from("roles")
          .select("id,name")
          .in("id", validRoleIds);

        if (rolesError) {
          setLoadError(rolesError.message);
          setReady(true);
          return;
        }

        const activeRoles = (roleRows || []) as RoleRow[];
        managerByRole = activeRoles.some((role) => MANAGER_ROLES.has(role.name));
        founderByRole = activeRoles.some((role) => role.name === "Kurucu");
      }

      setCurrentUserId(user.id);
      setNickname(userNickname);
      setCanManageMembers(user.email === ADMIN_EMAIL || managerByRole);
      setCanChangeNicknames(user.email === ADMIN_EMAIL || founderByRole);
      setReady(true);
    }

    checkProfile();
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050607] text-white">
        <p className="text-zinc-400">Sohbet odaları hazırlanıyor...</p>
      </main>
    );
  }


  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050607] px-4 text-white">
        <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-red-950/20 p-7">
          <h1 className="text-xl font-black text-red-300">
            Sohbet odaları açılamadı
          </h1>
          <p className="mt-3 break-words text-sm leading-6 text-zinc-300">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-[#d9aa4a] px-5 py-3 font-bold text-black"
          >
            Tekrar dene
          </button>
        </div>
      </main>
    );
  }

  if (banned) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050607] px-4 text-white">
        <div className="max-w-lg rounded-2xl border border-red-500/40 bg-red-950/20 p-8 text-center">
          <div className="text-5xl">🚫</div>
          <h1 className="mt-4 text-2xl font-black text-red-300">
            Sohbet erişimin engellendi
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Bu hesap sohbet odalarından yasaklanmış. Yönetimle iletişime geçebilirsin.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg border border-[#765625] px-5 py-3 text-[#e5b64e]"
          >
            Ana sayfaya dön
          </a>
        </div>
      </main>
    );
  }

  return (
    <CommunityLayout
      nickname={nickname}
      currentUserId={currentUserId}
      canManageMembers={canManageMembers}
      canChangeNicknames={canChangeNicknames}
    />
  );
}
