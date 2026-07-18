"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function sync(sessionUser: User | null) {
      if (!mounted) return;
      setUser(sessionUser);
      setNickname("");

      if (sessionUser) {
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          await fetch("/api/profile/bootstrap", {
            method: "POST",
            headers: { authorization: `Bearer ${session.session.access_token}` },
          });
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", sessionUser.id)
          .maybeSingle();
        if (mounted) setNickname(profile?.nickname || "");
      }

      if (mounted) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => sync(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setNickname("");
    setLoading(false);
    router.refresh();
  }

  if (loading) return <span className="text-xs text-zinc-500">Kontrol ediliyor...</span>;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="rounded-lg border border-[#b8862c] px-4 py-2.5 text-sm font-semibold text-[#e8bd67] transition hover:bg-[#d7a947] hover:text-black"
      >
        Giriş Yap
      </button>
    );
  }

  const label = nickname || (user.is_anonymous ? "Misafir" : user.email || "Hesap");

  return (
    <div className="haswolf-auth-user">
      <button type="button" onClick={() => router.push("/hesabim")} className="haswolf-auth-action">
        <span>👤</span><span>Hesabım</span>
      </button>
      <button type="button" onClick={logout} className="haswolf-auth-action haswolf-auth-action--logout">
        <span>↪</span><span>Çıkış Yap</span>
      </button>
      <span className="haswolf-auth-email" title={label}>{label}</span>
    </div>
  );
}
