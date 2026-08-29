"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DEVICE_KEY = "haswolf_device_id_v1";

type GuestSession = {
  access_token: string;
  refresh_token: string;
};

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export default function MisafirGirisPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"guest" | "resume" | "">("");
  const [existingGuest, setExistingGuest] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        router.replace("/topluluk");
        return;
      }

      try {
        const response = await fetch("/api/guest", {
          headers: { "x-device-id": getDeviceId() },
        });
        const result = await response.json();
        if (active && result.found) {
          setExistingGuest(result.nickname || "Misafir");
        }
      } catch {
        // Yeni misafir girişi yine kullanılabilir.
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [router]);

  async function applyGuestSession(session: GuestSession, isNewGuest: boolean) {
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (error) throw error;

    router.replace(isNewGuest ? "/mahlas" : "/topluluk");
    router.refresh();
  }

  async function resumeGuest() {
    setLoading("resume");
    setMessage("");

    try {
      const response = await fetch("/api/guest", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-device-id": getDeviceId(),
        },
        body: JSON.stringify({ action: "resume" }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Misafir hesabı açılamadı.");
      }

      await applyGuestSession(result.session, false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Misafir hesabı açılamadı.");
      setLoading("");
    }
  }

  async function createGuest() {
    setLoading("guest");
    setMessage("");

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) {
      setMessage(error?.message || "Misafir oturumu açılamadı.");
      setLoading("");
      return;
    }

    try {
      const response = await fetch("/api/guest", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${data.session.access_token}`,
          "x-device-id": getDeviceId(),
        },
        body: JSON.stringify({ action: "create" }),
      });
      const result = await response.json();

      if (!response.ok) {
        await supabase.auth.signOut();
        if (result.existingNickname) {
          setExistingGuest(result.existingNickname);
        }
        setMessage(result.error || "Misafir girişi tamamlanamadı.");
        setLoading("");
        return;
      }

      await applyGuestSession(result.session, true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Misafir hesabı oluşturulamadı.");
      setLoading("");
    }
  }

  return (
    <main className="haswolf-legal-shell flex min-h-screen items-center justify-center px-4 py-12">
      <section className="haswolf-legal-card w-full max-w-md p-7 sm:p-9">
        <a href="/" className="text-sm font-bold tracking-[.24em] text-[#d9aa4a]">HASWOLF</a>
        <h1 className="mt-4 text-3xl font-black">Sohbet Odaları</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Sohbet odalarına katılmak için misafir profili oluşturman gerekir. Yeni misafirlerde mahlas seçimi zorunludur.
        </p>

        {existingGuest ? (
          <button
            type="button"
            onClick={resumeGuest}
            disabled={Boolean(loading)}
            className="mt-7 w-full rounded-xl border border-[#d9aa4a] bg-gradient-to-r from-[#2b1d07] to-[#171005] px-4 py-4 font-black text-[#ffd875] disabled:opacity-60"
          >
            {loading === "resume" ? "Misafir profili açılıyor..." : `${existingGuest} ile Devam Et`}
          </button>
        ) : (
          <button
            type="button"
            onClick={createGuest}
            disabled={Boolean(loading)}
            className="mt-7 w-full rounded-xl border border-[#a97925] bg-[#161006] px-4 py-4 font-bold text-[#efc76b] disabled:opacity-60"
          >
            {loading === "guest" ? "Misafir hazırlanıyor..." : "Misafir Olarak Giriş Yap"}
          </button>
        )}

        {message && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm leading-6 text-red-300">
            {message}
          </p>
        )}

        <a href="/" className="mt-6 block text-center text-sm text-zinc-500 hover:text-white">Vitrine dön</a>
      </section>
    </main>
  );
}
