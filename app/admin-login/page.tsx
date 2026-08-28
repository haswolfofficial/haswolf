"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hasAdminAccess } from "@/lib/admin-access";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session) return;

      if (await hasAdminAccess(data.session.user)) {
        router.replace("/admin");
      }
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        throw new Error("E-posta veya şifre hatalı.");
      }

      const authorized = await hasAdminAccess(data.user);
      if (!authorized) {
        await supabase.auth.signOut();
        throw new Error("Bu hesabın yönetici yetkisi yok.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Giriş yapılamadı.");
    } finally {
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
          Bu giriş yalnızca yetkili yönetici hesapları içindir. Google bağlantısı kullanılmaz.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">E-posta</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#d9aa4a]"
              placeholder="yonetici@haswolf.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">Şifre</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#d9aa4a]"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#d9aa4a] px-4 py-4 font-black text-black disabled:opacity-60"
          >
            {loading ? "Kontrol ediliyor..." : "Admin Paneline Gir"}
          </button>
        </form>

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
