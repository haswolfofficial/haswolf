"use client";

import { useEffect, useRef } from "react";
import { usePersistentVoice } from "@/components/PersistentVoiceProvider";

export default function VoiceMediaSession() {
  const voice = usePersistentVoice();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/audio/haswolf-voice-session.wav");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.001;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (voice.connected) void audio.play().catch(() => undefined);
    else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [voice.connected]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    if (!voice.connected) {
      session.metadata = null;
      session.playbackState = "none";
      return;
    }

    const speaker = voice.activeSpeaker?.trim();
    session.metadata = new MediaMetadata({
      title: speaker ? `${speaker} konuşuyor` : "🟢 Bağlı",
      artist: voice.roomName || "HASWOLF Ses Odası",
      album: `🎤 Mikrofon ${voice.microphoneEnabled ? "açık" : "kapalı"} · 🔇 Ses ${voice.outputEnabled ? "açık" : "kapalı"}`,
      artwork: [
        { src: "/icons/haswolf-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/haswolf-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    session.playbackState = voice.microphoneEnabled ? "playing" : "paused";

    const action = (name: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { session.setActionHandler(name, handler); } catch {}
    };

    // Android ve PWA bildirimlerinde özel düğme yazısı verilemez.
    // Oynat = mikrofonu aç, Duraklat = mikrofonu kapat, Durdur = odadan ayrıl.
    action("play", () => {
      void audioRef.current?.play();
      void voice.setMicrophone(true);
    });
    action("pause", () => void voice.setMicrophone(false));
    action("stop", () => void voice.disconnectVoice());
    action("nexttrack", () => voice.setOutput(!voice.outputEnabled));

    return () => {
      action("play", null);
      action("pause", null);
      action("stop", null);
      action("nexttrack", null);
    };
  }, [
    voice.activeSpeaker,
    voice.connected,
    voice.disconnectVoice,
    voice.microphoneEnabled,
    voice.outputEnabled,
    voice.roomName,
    voice.setMicrophone,
    voice.setOutput,
  ]);

  return null;
}