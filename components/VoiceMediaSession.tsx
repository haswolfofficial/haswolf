"use client";

import { useEffect } from "react";
import { usePersistentVoice } from "@/components/PersistentVoiceProvider";

export default function VoiceMediaSession() {
  const voice = usePersistentVoice();

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!voice.connected) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: voice.activeSpeaker
        ? `${voice.activeSpeaker} konuÅŸuyor`
        : voice.microphoneEnabled
          ? `${voice.nickname} mikrofonu aÃ§Ä±k`
          : "Ses odasÄ± arka planda aktif",
      artist: voice.roomName || "HASWOLF Ses OdasÄ±",
      album: "HASWOLF",
      artwork: [
        { src: "/icons/haswolf-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/haswolf-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    navigator.mediaSession.playbackState = voice.outputEnabled
      ? "playing"
      : "paused";

    const setAction = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Mobil tarayÄ±cÄ± bu eylemi desteklemiyor olabilir.
      }
    };

    setAction("play", () => voice.setOutput(true));
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