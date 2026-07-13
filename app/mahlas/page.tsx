"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MahlasPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.nickname) {
        router.replace("/topluluk");
        return;
      }

      setLoading(false);
    }

    checkUser();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanNickname = nickname.trim();

    if (cleanNickname.length < 3 || cleanNickname.length > 20) {
      setMessage("Mahlas 3 ile 20 karakter arasında olmalı.");
      return;
    }

    if (!/^[a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+$/.test(cleanNickname)) {
      setMessage("Sadece harf, rakam ve alt çizgi kullanabilirsin.");
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: existingNickname } = await supabase
      .from("profiles")
      .select("id")
      .ilike("nickname", cleanNickname)
      .maybeSingle();

    if (existingNickname) {
      setMessage("Bu mahlas daha önce alınmış.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        nickname: cleanNickname,
        role: "member",
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      if (error.code === "23505") {
        setMessage("Bu mahlas daha önce alınmış.");
      } else {
        setMessage("Mahlas kaydedilemedi. Tekrar dene.");
      }

      setSaving(false);
      return;
    }

    router.replace("/topluluk");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050607] text-white">
        <p className="text-zinc-400">Hesabın kontrol ediliyor...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050607] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-[#8c641e]/40 bg-[#0b0d0f] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black tracking-[0.18em] text-[#d9aa4a]">
            HASWOLF
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Topluluk mahlası belirle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="nickname"
              className="mb-2 block text-sm font-semibold text-zinc-300"
            >
              Mahlas
            </label>

            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={20}
              autoComplete="off"
              placeholder="Örnek: KaraKurt"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none transition placeholder:text-zinc-600 focus:border-[#d9aa4a]"
            />

            <div className="mt-2 flex justify-between text-xs text-zinc-600">
              <span>3–20 karakter</span>
              <span>{nickname.length}/20</span>
            </div>
          </div>

          {message && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-[#d9aa4a] px-5 py-3 font-bold text-black transition hover:bg-[#efc668] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Kaydediliyor..." : "Mahlası Kaydet"}
          </button>
        </form>
      </section>
    </main>
  );
}