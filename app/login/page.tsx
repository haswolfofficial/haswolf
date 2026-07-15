"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"google" | "guest" | "">("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function handleGoogleLogin() {
    setLoading("google");
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });

    if (error) {
      setMessage(error.message);
      setLoading("");
    }
  }

  async function handleGuestLogin() {
    setLoading("guest");
    setMessage("");

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) {
      setMessage(error?.message || "Misafir oturumu açılamadı.");
      setLoading("");
      return;
    }

    const response = await fetch("/api/guest", {
      method: "POST",
      headers: {
        authorization: `Bearer ${data.session.access_token}`,
      },
    });
    const result = await response.json();

    if (!response.ok) {
      await supabase.auth.signOut();
      setMessage(result.error || "Misafir girişi tamamlanamadı.");
      setLoading("");
      return;
    }

    router.replace("/topluluk");
    router.refresh();
  }

  return (
    <main className="haswolf-legal-shell flex min-h-screen items-center justify-center px-4 py-12">
      <section className="haswolf-legal-card w-full max-w-md p-7 sm:p-9">
        <a href="/" className="text-sm font-bold tracking-[.24em] text-[#d9aa4a]">
          HASWOLF
        </a>
        <h1 className="mt-4 text-3xl font-black">Giriş Yap</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Google hesabınla giriş yap veya kayıt gerektirmeden otomatik numaralı misafir mahlası al.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={Boolean(loading)}
          className="mt-7 w-full rounded-xl bg-white px-4 py-4 font-bold text-black disabled:opacity-60"
        >
          {loading === "google" ? "Google açılıyor..." : "Google ile Giriş Yap"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-600">
          <span className="h-px flex-1 bg-white/10" />
          veya
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={Boolean(loading)}
          className="w-full rounded-xl border border-[#a97925] bg-[#161006] px-4 py-4 font-bold text-[#efc76b] disabled:opacity-60"
        >
          {loading === "guest" ? "Misafir hazırlanıyor..." : "Misafir Olarak Giriş"}
        </button>

        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Misafir adları Misafir 1, Misafir 2, Misafir 3 şeklinde otomatik verilir. Ham IP saklanmaz; güvenlik için geri döndürülemez IP özeti kullanılır.
        </p>

        {message && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-300">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
