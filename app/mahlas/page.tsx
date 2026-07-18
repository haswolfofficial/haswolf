"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MahlasPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [baseNickname, setBaseNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname,is_guest")
        .eq("id", user.id)
        .maybeSingle();

      const guest = Boolean(profile?.is_guest || user.is_anonymous);
      setIsGuest(guest);
      setBaseNickname(profile?.nickname || "Misafir");
      if (!guest && profile?.nickname) { router.replace("/topluluk"); return; }
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/login");

    const { error } = await supabase.from("profiles").upsert(
      { id: user.id, nickname: isGuest ? `${baseNickname.split(" - (")[0]} - (${cleanNickname})` : cleanNickname, role: "member", is_guest: isGuest },
      { onConflict: "id" },
    );

    if (error) {
      setMessage(error.code === "23505" ? "Bu mahlas daha önce alınmış." : "Mahlas kaydedilemedi.");
      setSaving(false);
      return;
    }

    router.replace("/topluluk");
    router.refresh();
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#050607] text-white"><p>Hesabın kontrol ediliyor...</p></main>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050607] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-[#8c641e]/40 bg-[#0b0d0f] p-8">
        <h1 className="text-2xl font-black text-[#d9aa4a]">Topluluk mahlası</h1>
        <p className="mt-2 text-sm text-zinc-500">{isGuest ? `Misafir numaran korunur; görünüm ${baseNickname.split(" - (")[0]} - (Mahlas) olur.` : "Google hesabın için bir kez mahlas belirle."}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <input value={nickname} onChange={(e)=>setNickname(e.target.value)} maxLength={20} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-[#d9aa4a]" placeholder="Örnek: KaraKurt" />
          {message && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{message}</p>}
          <button disabled={saving} className="w-full rounded-2xl bg-[#d9aa4a] px-5 py-3 font-bold text-black disabled:opacity-60">{saving?"Kaydediliyor...":"Mahlası Kaydet"}</button>
        </form>
      </section>
    </main>
  );
}
