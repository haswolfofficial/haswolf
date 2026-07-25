"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePersistentVoice } from "@/components/PersistentVoiceProvider";

export default function VoiceRoom({
  roomName,
  nickname,
  currentUserId,
  canManageMembers,
}: {
  roomName: string;
  nickname: string;
  currentUserId: string;
  canManageMembers: boolean;
}) {
  const voice = usePersistentVoice();
  const [deletingId, setDeletingId] = useState("");
  const [moderationError, setModerationError] = useState("");

  useEffect(() => {
    void voice.connectVoice(roomName, nickname, currentUserId);
  }, [currentUserId, nickname, roomName, voice.connectVoice]);

  async function deleteGuest(userId: string, identity: string) {
    if (!window.confirm("Bu misafir oturumu tamamen silinsin mi?")) return;

    setDeletingId(userId);
    setModerationError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      const response = await fetch("/api/admin/delete-guest", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          userId,
          roomName,
          participantIdentity: identity,
        }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Misafir silinemedi.");
      }
    } catch (error) {
      setModerationError(
        error instanceof Error ? error.message : "Misafir silinemedi.",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-7">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-5 sm:p-7">
          <div>
            <h2 className="text-2xl font-black text-[#d9aa4a]">
              ğŸ”Š {roomName}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {nickname} olarak baÄŸlandÄ±n. Ana sayfaya veya markete geÃ§tiÄŸinde
              ses baÄŸlantÄ±sÄ± kÃ¼Ã§Ã¼k panelde devam eder.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info
              title="BaÄŸlantÄ±"
              value={
                voice.connecting
                  ? "BaÄŸlanÄ±yor"
                  : voice.connected
                    ? "BaÄŸlÄ±"
                    : "KapalÄ±"
              }
            />
            <Info title="KatÄ±lÄ±mcÄ±" value={String(voice.participantCount)} />
            <Info
              title="KonuÅŸma sÄ±rasÄ±"
              value={
                voice.activeSpeaker
                  ? voice.activeSpeaker
                  : voice.microphoneEnabled
                    ? "Sende"
                    : "BoÅŸ"
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
              {voice.activeSpeaker
                ? `â³ ${voice.activeSpeaker} konuÅŸuyor`
                : voice.microphoneEnabled
                  ? "ğŸŸ¢ Mikrofon AÃ§Ä±k"
                  : "ğŸ¤ KonuÅŸmayÄ± AÃ§"}
            </button>

            <div className="haswolf-voice-room-actions">
              <button
                type="button"
                onClick={() => voice.setOutput(!voice.outputEnabled)}
              >
                {voice.outputEnabled ? "ğŸ”Š Sesi kapat" : "ğŸ”‡ Sesi aÃ§"}
              </button>

              <button
                type="button"
                className="is-danger"
                onClick={() => void voice.disconnectVoice()}
              >
                Ses odasÄ±ndan Ã§Ä±k
              </button>
            </div>

            <p className="mt-4 max-w-xl text-center text-sm text-zinc-500">
              YankÄ± Ã¶nleme, gÃ¼rÃ¼ltÃ¼ azaltma ve otomatik kazanÃ§ denetimi aktiftir.
            </p>

            <div className="mt-6 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#0a0c0e] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black text-[#d9aa4a]">
                  Ses odasÄ±ndaki katÄ±lÄ±mcÄ±lar
                </h3>
                <span className="text-xs text-zinc-500">
                  {voice.participants.length} kiÅŸi
                </span>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {voice.participants.map((participant) => (
                  <div
                    key={participant.identity}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-[#111315] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <strong className="block truncate text-white">
                        {participant.name}
                        {participant.isLocal ? " (Sen)" : ""}
                      </strong>
                      <small className="text-zinc-500">
                        {participant.isSpeaking
                          ? "KonuÅŸuyor"
                          : participant.isGuest
                            ? "Misafir"
                            : "Ãœye"}
                      </small>
                    </div>

                    {canManageMembers &&
                      participant.isGuest &&
                      !participant.isLocal && (
                        <button
                          type="button"
                          disabled={deletingId === participant.userId}
                          onClick={() =>
                            void deleteGuest(
                              participant.userId,
                              participant.identity,
                            )
                          }
                          className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50"
                        >
                          {deletingId === participant.userId
                            ? "Siliniyor..."
                            : "Misafiri sil"}
                        </button>
                      )}
                  </div>
                ))}

                {voice.participants.length === 0 && (
                  <p className="py-5 text-center text-sm text-zinc-500">
                    KatÄ±lÄ±mcÄ±lar yÃ¼kleniyor...
                  </p>
                )}
              </div>
            </div>

            {(voice.error || moderationError) && (
              <p className="mt-4 text-sm text-red-400">
                {moderationError || voice.error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0c0e] p-4">
      <small className="text-zinc-500">{title}</small>
      <strong className="mt-1 block text-white">{value}</strong>
    </div>
  );
}
