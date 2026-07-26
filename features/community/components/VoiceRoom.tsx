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


  async function moderateParticipant(action: "kick" | "ban" | "mute" | "unmute" | "role" | "speak", participant: { userId: string; identity: string }, value?: string | boolean) {
    setModerationError("");
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch("/api/admin/member-action", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
      body: JSON.stringify({ action, userId: participant.userId, roomName, participantIdentity: participant.identity, value }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setModerationError(result.error || "İşlem tamamlanamadı.");
  }

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
              🔊 {roomName}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {nickname} olarak bağlandın. Ana sayfaya veya markete geçtiğinde
              ses bağlantısı küçük panelde devam eder.
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
            <Info title="Katılımcı" value={String(voice.participantCount)} />
            <Info
              title="Konuşma sırası"
              value={
                voice.activeSpeaker
                  ? voice.activeSpeaker
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
              {voice.activeSpeaker
                ? `⏳ ${voice.activeSpeaker} konuşuyor`
                : voice.microphoneEnabled
                  ? "🟢 Mikrofon Açık"
                  : "🎤 Konuşmayı Aç"}
            </button>

            <div className="haswolf-voice-room-actions">
              <button
                type="button"
                onClick={() => voice.setOutput(!voice.outputEnabled)}
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
              Yankı önleme, gürültü azaltma ve otomatik kazanç denetimi aktiftir.
            </p>

            <div className="mt-6 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#0a0c0e] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black text-[#d9aa4a]">
                  Ses odasındaki katılımcılar
                </h3>
                <span className="text-xs text-zinc-500">
                  {voice.participants.length} kişi
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
                          ? "Konuşuyor"
                          : participant.isGuest
                            ? "Misafir"
                            : "Üye"}
                      </small>
                    </div>

                    {canManageMembers && !participant.isLocal && (
                      <div className="haswolf-voice-member-actions">
                        <button type="button" onClick={() => void moderateParticipant("speak", participant, true)}>Konuşma ver</button>
                        <button type="button" onClick={() => void moderateParticipant("speak", participant, false)}>Konuşmayı al</button>
                        <button type="button" onClick={() => void moderateParticipant("mute", participant)}>Sustur</button>
                        <button type="button" onClick={() => void moderateParticipant("kick", participant)}>Kick</button>
                        <button type="button" className="is-danger" onClick={() => void moderateParticipant("ban", participant, true)}>Ban</button>
                        {participant.isGuest && (
                          <button
                            type="button"
                            className="is-danger"
                            disabled={deletingId === participant.userId}
                            onClick={() => void deleteGuest(participant.userId, participant.identity)}
                          >
                            {deletingId === participant.userId ? "Siliniyor..." : "Üyeyi sil"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {voice.participants.length === 0 && (
                  <p className="py-5 text-center text-sm text-zinc-500">
                    Katılımcılar yükleniyor...
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