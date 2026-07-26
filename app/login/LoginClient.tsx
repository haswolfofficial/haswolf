"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  consumeReturnTo,
  rememberReturnTo,
  sanitizeReturnTo,
} from "@/lib/auth-return";

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

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"google" | "guest" | "resume" | "">("");
  const [existingGuest, setExistingGuest] = useState<string | null>(null);

  const requestedReturnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  useEffect(() => {
    let active = true;

    async function initializeLogin() {
      const { data } = await supabase.auth.getSession();

      if (!active) return;

      if (data.session) {
        router.replace(consumeReturnTo(requestedReturnTo));
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
        // Misafir sorgusu başarısız olsa bile normal giriş ekranı çalışmaya devam eder.
      }
    }

    void initializeLogin();

    return () => {
      active = false;
    };
  }, [requestedReturnTo, router]);

  async function handleGoogleLogin() {
    rememberReturnTo(requestedReturnTo);
    setLoading("google");
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login?returnTo=${encodeURIComponent(requestedReturnTo)}`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading("");
    }
  }

  async function applyGuestSession(session: GuestSession) {
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) throw error;

    router.replace(consumeReturnTo(requestedReturnTo || "/topluluk"));
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

      await applyGuestSession(result.session);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Misafir hesabı açılamadı.",
      );
      setLoading("");
    }
  }

  async function handleGuestLogin() {
    if (existingGuest) {
      await resumeGuest();
      return;
    }

    setLoading("guest");
    setMessage("");

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error || !data.session) {
      const raw = error?.message || "Misafir oturumu açılamadı.";

      setMessage(
        raw.toLowerCase().includes("anonymous sign-ins are disabled")
          ? "Misafir girişleri Supabase tarafında henüz etkin değil. Authentication → Sign In / Providers → Allow anonymous sign-ins seçeneğini açıp Save changes düğmesine bas."
          : raw,
      );
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

      await applyGuestSession(result.session);
    } catch (sessionError) {
      setMessage(
        sessionError instanceof Error
          ? sessionError.message
          : "Misafir oturumu kaydedilemedi.",
      );
      setLoading("");
    }
  }

  return (
    <main className="haswolf-legal-shell flex min-h-screen items-center justify-center px-4 py-12">
      <section className="haswolf-legal-card w-full max-w-md p-7 sm:p-9">
        <a
          href="/"
          className="text-sm font-bold tracking-[.24em] text-[#d9aa4a]"
        >
          HASWOLF
        </a>

        <h1 className="mt-4 text-3xl font-black">Giriş Yap</h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Google hesabınla giriş yap veya kayıt gerektirmeden otomatik numaralı
          misafir mahlası al.
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

        {existingGuest ? (
          <button
            type="button"
            onClick={resumeGuest}
            disabled={Boolean(loading)}
            className="w-full rounded-xl border border-[#d9aa4a] bg-gradient-to-r from-[#2b1d07] to-[#171005] px-4 py-4 font-black text-[#ffd875] shadow-[0_0_30px_rgba(217,170,74,.12)] disabled:opacity-60"
          >
            {loading === "resume"
              ? "Misafir profili açılıyor..."
              : `${existingGuest} ile Devam Et`}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={Boolean(loading)}
            className="w-full rounded-xl border border-[#a97925] bg-[#161006] px-4 py-4 font-bold text-[#efc76b] disabled:opacity-60"
          >
            {loading === "guest"
              ? "Misafir hazırlanıyor..."
              : "Misafir Olarak Giriş"}
          </button>
        )}

        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Her cihaz/bağlantı için tek misafir profili tutulur. Daha önce
          oluşturulmuş profil bulunduğunda aynı “Misafir 1” hesabıyla devam etme
          düğmesi gösterilir.
        </p>

        {message && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm leading-6 text-red-300">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
