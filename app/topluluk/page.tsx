"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CommunityLayout from "@/features/community/components/CommunityLayout";

export default function ToplulukPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profil alınamadı:", error);
        return;
      }

      const userNickname = profile?.nickname?.trim();

      if (!userNickname) {
        router.replace("/mahlas");
        return;
      }

      setNickname(userNickname);
      setReady(true);
    }

    checkProfile();
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050607] text-white">
        <p className="text-zinc-400">Topluluk hazırlanıyor...</p>
      </main>
    );
  }

  return <CommunityLayout nickname={nickname} />;
}