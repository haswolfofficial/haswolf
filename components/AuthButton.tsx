"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

declare global {
  interface Window {
    HaswolfAndroid?: {
      signInWithGoogle: () => void;
      signOutGoogle?: () => void;
    };
    onHaswolfGoogleToken?: (idToken: string) => void;
    onHaswolfGoogleError?: (message: string) => void;
  }
}

export default function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setUser(data.session?.user ?? null);
      setLoading(false);

      if (window.location.hash.includes("access_token")) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search
        );
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setLoading(false);
      setAuthMessage("");
    });

    window.onHaswolfGoogleToken = async (idToken: string) => {
      setLoading(true);
      setAuthMessage("Google hesabı doğrulanıyor...");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        setLoading(false);
        setAuthMessage(error.message);
        return;
      }

      setUser(data.user ?? data.session?.user ?? null);
      setLoading(false);
      setAuthMessage("");
      router.refresh();
    };

    window.onHaswolfGoogleError = (message: string) => {
      setLoading(false);
      setAuthMessage(message || "Google girişi tamamlanamadı.");
    };

    return () => {
      mounted = false;
      subscription.unsubscribe();
      delete window.onHaswolfGoogleToken;
      delete window.onHaswolfGoogleError;
    };
  }, [router]);

  async function handleLogin() {
    setAuthMessage("");

    // Android uygulamasında native Google hesap seçiciyi açar.
    if (window.HaswolfAndroid?.signInWithGoogle) {
      setLoading(true);
      setAuthMessage("Google hesabı açılıyor...");
      window.HaswolfAndroid.signInWithGoogle();
      return;
    }

    // Normal web tarayıcısında mevcut giriş sayfasını açar.
    router.push("/login");
  }

  async function handleLogout() {
    setLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      setAuthMessage(error.message);
      return;
    }

    window.HaswolfAndroid?.signOutGoogle?.();
    setUser(null);
    setLoading(false);
    router.refresh();
  }

  if (loading) {
    return (
      <span className="text-sm text-zinc-400">
        {authMessage || "Kontrol ediliyor..."}
      </span>
    );
  }

  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="max-w-[220px] truncate text-sm text-zinc-300">
          {user.email}
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-[#8c641e]/60 bg-white/5 px-3 py-2 text-sm text-[#e8bd67] transition hover:bg-white/10"
        >
          Çıkış Yap
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogin}
        className="rounded-lg border border-[#b8862c] px-4 py-2.5 text-sm font-semibold text-[#e8bd67] transition hover:bg-[#d7a947] hover:text-black"
      >
        Google ile Giriş Yap
      </button>

      {authMessage && (
        <p className="mt-2 max-w-[260px] text-xs text-red-400">
          {authMessage}
        </p>
      )}
    </div>
  );
}