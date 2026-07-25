"use client";

import { useEffect } from "react";
import { usePersistentVoice } from "@/components/PersistentVoiceProvider";

export default function VoiceRoom({
  roomName,
  nickname,
}: {
  roomName: string;
  nickname: string;
}) {
  const voice = usePersistentVoice();

  useEffect(() => {
    void voice.connectVoice(roomName, nickname);
  }, [nickname, roomName, voice.connectVoice]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-7">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-5 sm:p-7">
          <div>
            <h2 className="text-2xl font-black text-[#d9aa4a]">
              🔊 {roomName}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {nickname} olarak bağlandın. Ana sayfaya veya markete
              geçtiğinde ses bağlantısı küçük panelde devam eder.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info
              title="Bağlantı"
              value={
                voice.connecting
                  ? "Bağlanıyor"
                  : voice.connected
                    ? "Bağlı"
                    : "Kapalı"
              }
            />
            <Info
              title="Katılımcı"
              value={String(voice.participantCount)}
            />
            <Info
              title="Konuşma sırası"
              value={
                voice.blockedBySpeaker
                  ? voice.activeSpeaker || "Başka kullanıcı"
                  : voice.microphoneEnabled
                    ? "Sende"
                    : "Boş"
              }
            />
          </div>

          <div className="mt-8 flex flex-col items-center">
            <button
              type="button"
              disabled={!voice.connected || voice.connecting}
              onClick={() =>
                void voice.setMicrophone(!voice.microphoneEnabled)
              }
              className={`min-w-64 rounded-2xl px-10 py-6 text-xl font-black ${
                voice.microphoneEnabled
                  ? "bg-green-600 text-white"
                  : "bg-[#d9aa4a] text-black"
              }`}
            >
              {voice.blockedBySpeaker
                ? `⏳ ${voice.activeSpeaker || "Bir kullanıcı"} konuşuyor`
                : voice.microphoneEnabled
                  ? "🟢 Mikrofon Açık"
                  : "🎤 Konuşmayı Aç"}
            </button>

            <div className="haswolf-voice-room-actions">
              <button
                type="button"
                onClick={() =>
                  voice.setOutput(!voice.outputEnabled)
                }
              >
                {voice.outputEnabled ? "🔊 Sesi kapat" : "🔇 Sesi aç"}
              </button>

              <button
                type="button"
                className="is-danger"
                onClick={() => void voice.disconnectVoice()}
              >
                Ses odasından çık
              </button>
            </div>

            <p className="mt-4 max-w-xl text-center text-sm text-zinc-500">
              Başka biri konuşurken mikrofonun otomatik susturulur.
              Konuşma bitince sıra sana geri gelir.
            </p>

            {voice.error && (
              <p className="mt-4 text-sm text-red-400">
                {voice.error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0c0e] p-4">
      <small className="text-zinc-500">{title}</small>
      <strong className="mt-1 block text-white">{value}</strong>
    </div>
  );
}
