"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hasAdminAccess } from "@/lib/admin-access";

export default function LoginClient() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session) return;

      const authorized = await hasAdminAccess(data.session.user);
      if (authorized) {
        router.replace("/admin");
        return;
      }

      await supabase.auth.signOut();
      if (active) setMessage("Bu Google hesabının yönetici yetkisi yok.");
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="haswolf-legal-shell flex min-h-screen items-center justify-center px-4 py-12">
      <section className="haswolf-legal-card w-full max-w-md p-7 sm:p-9">
        <a href="/" className="text-sm font-bold tracking-[.24em] text-[#d9aa4a]">
          HASWOLF
        </a>

        <h1 className="mt-4 text-3xl font-black">Yönetici Girişi</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Bu giriş yalnızca HASWOLF yönetici hesapları içindir. Normal ziyaretçiler giriş yapmadan vitrini kullanabilir.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-7 w-full rounded-xl bg-white px-4 py-4 font-bold text-black disabled:opacity-60"
        >
          {loading ? "Google açılıyor..." : "Google ile Yönetici Girişi"}
        </button>

        {message && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm leading-6 text-red-300">
            {message}
          </p>
        )}

        <a href="/" className="mt-6 block text-center text-sm text-zinc-500 hover:text-white">
          Vitrine dön
        </a>
      </section>
    </main>
  );
}
