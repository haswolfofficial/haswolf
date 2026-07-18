"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";

type VoiceRoomProps = {
  roomName: string;
  nickname: string;
};

type TokenResponse = {
  token?: string;
  serverUrl?: string;
  error?: string;
};

export default function VoiceRoom({
  roomName,
  nickname,
}: VoiceRoomProps) {
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function getToken() {
      try {
        const response = await fetch("/api/livekit-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName,
            participantName: nickname,
          }),
        });

        const data: TokenResponse = await response.json();

        if (!response.ok || !data.token || !data.serverUrl) {
          throw new Error(
            data.error || "Ses odasına bağlanılamadı."
          );
        }

        if (!cancelled) {
          setToken(data.token);
          setServerUrl(data.serverUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Ses odasına bağlanılamadı."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    getToken();

    return () => {
      cancelled = true;
    };
  }, [roomName, nickname]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400">
          Ses odasına bağlanılıyor...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-2xl border border-red-500/40 bg-[#111315] p-6 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio={false}
      video={false}
      className="flex min-h-0 flex-1 flex-col"
    >
      <VoiceRoomContent nickname={nickname} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function VoiceRoomContent({
  nickname,
}: {
  nickname: string;
}) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const room = useRoomContext();

  const [connected, setConnected] = useState(true);
  const [talking, setTalking] = useState(false);
  const [microphoneError, setMicrophoneError] =
    useState("");

  async function startTalking() {
    if (!connected || talking) {
      return;
    }

    try {
      setMicrophoneError("");
      await localParticipant.setMicrophoneEnabled(true);
      setTalking(true);
    } catch (error) {
      console.error("Mikrofon açılamadı:", error);

      setMicrophoneError(
        "Mikrofon açılamadı. Tarayıcı mikrofon iznini kontrol et."
      );
    }
  }

  async function stopTalking() {
    if (!talking) {
      return;
    }

    try {
      await localParticipant.setMicrophoneEnabled(false);
    } catch (error) {
      console.error("Mikrofon kapatılamadı:", error);
    } finally {
      setTalking(false);
    }
  }

  async function leaveRoom() {
    await stopTalking();
    await room.disconnect();
    setConnected(false);
  }

  if (!connected) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="text-zinc-400">
            Ses odasından ayrıldın.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-[#d9aa4a] px-6 py-3 font-bold text-black"
          >
            Yeniden Bağlan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-7">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-7">
          <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#d9aa4a]">
                🔊 Genel Ses
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                {nickname} olarak bağlandın
              </p>
            </div>

            <button
              type="button"
              onClick={leaveRoom}
              className="rounded-xl border border-red-500/50 px-5 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10"
            >
              Ses Odasından Ayrıl
            </button>
          </div>

          <div className="mt-6">
            <p className="text-sm text-zinc-400">
              Odada {participants.length} kişi var
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {participants.map((participant) => (
                <div
                  key={participant.identity}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                    participant.isSpeaking
                      ? "border-green-500 bg-green-500/10"
                      : "border-zinc-800 bg-[#0a0c0e]"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d9aa4a] text-lg font-black text-black">
                    {(participant.name || participant.identity)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-bold">
                      {participant.name ||
                        participant.identity}
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        participant.isSpeaking
                          ? "text-green-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {participant.isSpeaking
                        ? "🟢 Konuşuyor"
                        : "Dinliyor"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center">
            <button
              type="button"
              onPointerDown={startTalking}
              onPointerUp={stopTalking}
              onPointerCancel={stopTalking}
              onPointerLeave={stopTalking}
              onContextMenu={(event) =>
                event.preventDefault()
              }
              className={`min-w-64 select-none rounded-2xl px-10 py-6 text-xl font-black transition ${
                talking
                  ? "scale-95 bg-green-600 text-white shadow-[0_0_40px_rgba(34,197,94,.35)]"
                  : "bg-[#d9aa4a] text-black hover:bg-[#efc668]"
              }`}
            >
              {talking
                ? "🟢 Konuşuyorsun"
                : "🎤 Basılı Tut ve Konuş"}
            </button>

            <p className="mt-4 text-sm text-zinc-500">
              Butona basılı tuttuğun sürece mikrofon açık kalır.
            </p>

            {microphoneError && (
              <p className="mt-4 text-sm text-red-400">
                {microphoneError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}