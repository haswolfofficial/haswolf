"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Announcement = {
  id: string;
  message: string;
  created_at: string;
};

const DISMISSED_KEY = "haswolf-dismissed-announcements-v1";
const SOUND_KEY = "haswolf-announcement-sound-v1";
let announcementAudioContext: AudioContext | null = null;

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function rememberDismissed(id: string) {
  const next = Array.from(new Set([...readDismissed(), id])).slice(-100);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
}

async function playAnnouncementSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    announcementAudioContext ||= new AudioContextClass();
    if (announcementAudioContext.state === "suspended") {
      await announcementAudioContext.resume();
    }

    const context = announcementAudioContext;
    const gain = context.createGain();
    gain.connect(context.destination);
    const start = context.currentTime;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);

    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start + index * 0.12);
      oscillator.connect(gain);
      oscillator.start(start + index * 0.12);
      oscillator.stop(start + 0.34 + index * 0.12);
    });
  } catch {
    // Tarayıcı otomatik sesi engellerse duyuru kartı yine gösterilir.
  }
}

export default function AnnouncementBroadcast() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const newsRoomIdRef = useRef<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(SOUND_KEY);
    setSoundEnabled(stored !== "off");

    const unlockAudio = () => {
      void playAnnouncementSound();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function show(item: Announcement) {
      if (readDismissed().includes(item.id)) return;
      if (!active) return;
      setCountdown(5);
      setAnnouncement(item);
      if (localStorage.getItem(SOUND_KEY) !== "off") {
        void playAnnouncementSound();
      }
    }

    async function start() {
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("slug", "news")
        .maybeSingle();

      if (!active || !room?.id) return;
      newsRoomIdRef.current = String(room.id);

      const { data: latest } = await supabase
        .from("chat_messages")
        .select("id,message,created_at")
        .eq("room_id", room.id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest) {
        const age = Date.now() - new Date(latest.created_at).getTime();
        if (age < 24 * 60 * 60 * 1000) await show(latest as Announcement);
      }

      realtimeChannel = supabase
        .channel("haswolf-global-announcement-broadcast")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${room.id}`,
          },
          (payload) => {
            const next = payload.new as Announcement & { is_hidden?: boolean };
            if (next.is_hidden) return;
            void show({ id: String(next.id), message: next.message, created_at: next.created_at });
          },
        )
        .subscribe();
    }

    void start();
    return () => {
      active = false;
      if (realtimeChannel) void supabase.removeChannel(realtimeChannel);
    };
  }, []);

  useEffect(() => {
    if (!announcement || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [announcement, countdown]);

  function closeAnnouncement() {
    if (!announcement || countdown > 0) return;
    rememberDismissed(announcement.id);
    setAnnouncement(null);
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    if (next) void playAnnouncementSound();
  }

  if (!announcement) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="HASWOLF duyurusu">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#d9aa4a]/60 bg-[#090b0d] shadow-[0_0_80px_rgba(217,170,74,0.28)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#f6c85f] to-transparent" />
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#d9aa4a]/15 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.3em] text-[#d9aa4a]">HASWOLF TOPLULUK</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">📢 Yeni Duyuru</h2>
            </div>
            <button
              type="button"
              onClick={closeAnnouncement}
              disabled={countdown > 0}
              className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm font-bold text-zinc-300 transition hover:border-[#d9aa4a]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={countdown > 0 ? `Duyuru ${countdown} saniye sonra kapatılabilir` : "Duyuruyu kapat"}
            >
              {countdown > 0 ? countdown : "✕"}
            </button>
          </div>

          <div className="my-6 rounded-2xl border border-[#d9aa4a]/20 bg-[#d9aa4a]/[.055] p-5 text-base leading-7 text-zinc-100 sm:text-lg">
            {announcement.message}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-zinc-500">
              {new Date(announcement.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
            </span>
            <button
              type="button"
              onClick={toggleSound}
              className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-[#d9aa4a]/50 hover:text-white"
            >
              {soundEnabled ? "🔔 Duyuru sesi açık" : "🔕 Duyuru sesi kapalı"}
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] text-zinc-600">
            Kapatılan bu duyuru aynı cihazda tekrar açılmaz.
          </p>
        </div>
      </div>
    </div>
  );
}
