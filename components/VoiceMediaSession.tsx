"use client";

import { useEffect, useRef } from "react";
import { usePersistentVoice } from "@/components/PersistentVoiceProvider";

type ExtendedMediaSession = MediaSession & {
  setMicrophoneActive?: (active: boolean) => void;
};

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

    if (voice.connected) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [voice.connected]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const session = navigator.mediaSession as ExtendedMediaSession;

    if (!voice.connected) {
      session.metadata = null;
      session.playbackState = "none";
      return;
    }

    const speaker = voice.activeSpeaker?.trim();
    const title = speaker
      ? speaker + " konuşuyor"
      : voice.microphoneEnabled
        ? (voice.nickname || "Sen") + " konuşmaya hazır"
        : "Ses odası arka planda aktif";

    session.metadata = new MediaMetadata({
      title,
      artist: voice.roomName || "HASWOLF Ses Odası",
      album: voice.outputEnabled ? "Ses açık" : "Ses kapalı",
      artwork: [
        { src: "/icons/haswolf-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/haswolf-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    session.playbackState = voice.outputEnabled ? "playing" : "paused";

    try {
      session.setMicrophoneActive?.(voice.microphoneEnabled);
    } catch {}

    const setAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        session.setActionHandler(action, handler);
      } catch {}
    };

    setAction("play", () => {
      voice.setOutput(true);
      void audioRef.current?.play();
    });
    setAction("pause", () => voice.setOutput(false));
    setAction("stop", () => void voice.disconnectVoice());

    return () => {
      setAction("play", null);
      setAction("pause", null);
      setAction("stop", null);
    };
  }, [
    voice.activeSpeaker,
    voice.connected,
    voice.disconnectVoice,
    voice.microphoneEnabled,
    voice.nickname,
    voice.outputEnabled,
    voice.roomName,
    voice.setOutput,
  ]);

  return null;
}
