"use client";

import { useEffect, useState } from "react";
import MemberSidebar from "./MemberSidebar";
import ChannelSidebar from "./ChannelSidebar";
import MessageBubble from "./MessageBubble";
import VoiceRoom from "./VoiceRoom";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "../../../types/chat";
import { rooms } from "../constants/rooms";

type CommunityLayoutProps = {
  nickname: string;
};

type DatabaseMessage = {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  nickname: string | null;
};

export default function CommunityLayout({
  nickname,
}: CommunityLayoutProps) {
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState("");

  const isVoiceRoom = selectedRoom.slug.startsWith("voice");

  useEffect(() => {
    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (isVoiceRoom) {
      setMessages([]);
      setSelectedRoomId("");
      return;
    }

    let active = true;

    async function loadMessages() {
      setMessagesLoading(true);
      setMessageError("");
      setMessages([]);
      setSelectedRoomId("");

      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("slug", selectedRoom.slug)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (roomError || !room) {
        console.error("Oda bulunamadı:", roomError);
        setMessageError("Sohbet odası bulunamadı.");
        setMessagesLoading(false);
        return;
      }

      setSelectedRoomId(room.id);

      const { data: databaseMessages, error: messagesError } =
        await supabase
          .from("chat_messages")
          .select("id, room_id, user_id, message, created_at")
          .eq("room_id", room.id)
          .order("created_at", { ascending: true });

      if (!active) {
        return;
      }

      if (messagesError) {
        console.error("Mesajlar alınamadı:", messagesError);
        setMessageError("Mesajlar yüklenemedi.");
        setMessagesLoading(false);
        return;
      }

      const rows = (databaseMessages || []) as DatabaseMessage[];
      const userIds = [...new Set(rows.map((item) => item.user_id))];

      let profiles: ProfileRow[] = [];

      if (userIds.length > 0) {
        const { data: profileData, error: profilesError } =
          await supabase
            .from("profiles")
            .select("id, nickname")
            .in("id", userIds);

        if (profilesError) {
          console.error("Mahlaslar alınamadı:", profilesError);
        } else {
          profiles = (profileData || []) as ProfileRow[];
        }
      }

      const profileMap = new Map(
        profiles.map((profile) => [
          profile.id,
          profile.nickname || "Kullanıcı",
        ])
      );

      const formattedMessages: ChatMessage[] = rows.map((item) => ({
        id: item.id,
        roomSlug: selectedRoom.slug,
        nickname: profileMap.get(item.user_id) || "Kullanıcı",
        message: item.message,
        createdAt: new Date(item.created_at).toLocaleTimeString(
          "tr-TR",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        isMine: item.user_id === currentUserId,
      }));

      setMessages(formattedMessages);
      setMessagesLoading(false);
    }

    loadMessages();

    return () => {
      active = false;
    };
  }, [selectedRoom.slug, isVoiceRoom, currentUserId]);

  useEffect(() => {
    if (!selectedRoomId || isVoiceRoom) {
      return;
    }

    const channel = supabase
      .channel(`chat-room-${selectedRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${selectedRoomId}`,
        },
        async (payload) => {
          const inserted = payload.new as DatabaseMessage;

          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", inserted.user_id)
            .maybeSingle();

          const incomingMessage: ChatMessage = {
            id: inserted.id,
            roomSlug: selectedRoom.slug,
            nickname: profile?.nickname || "Kullanıcı",
            message: inserted.message,
            createdAt: new Date(
              inserted.created_at
            ).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMine: inserted.user_id === currentUserId,
          };

          setMessages((current) => {
            const alreadyExists = current.some(
              (message) => message.id === incomingMessage.id
            );

            if (alreadyExists) {
              return current;
            }

            return [...current, incomingMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    selectedRoomId,
    selectedRoom.slug,
    isVoiceRoom,
    currentUserId,
  ]);

  async function sendMessage() {
    const text = newMessage.trim();

    if (
      !text ||
      isVoiceRoom ||
      !selectedRoomId ||
      !currentUserId
    ) {
      return;
    }

    setMessageError("");

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: selectedRoomId,
        user_id: currentUserId,
        message: text,
      });

    if (error) {
      console.error("Mesaj gönderilemedi:", error);
      setMessageError("Mesaj gönderilemedi.");
      return;
    }

    setNewMessage("");
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#050607] text-white">
      <ChannelSidebar
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-[#0a0c0e] px-6">
          <div>
            <h1 className="text-xl font-bold">
              {selectedRoom.icon} {selectedRoom.name}
            </h1>

            <p className="mt-1 text-xs tracking-widest text-zinc-500">
              {isVoiceRoom
                ? "HASWOLF SES KANALI"
                : "HASWOLF COMMUNITY"}
            </p>
          </div>

          {!isVoiceRoom && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                title="Emoji"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 transition hover:border-[#d9aa4a]"
              >
                😀
              </button>

              <button
                type="button"
                title="Dosya ekle"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 transition hover:border-[#d9aa4a]"
              >
                📎
              </button>
            </div>
          )}
        </header>

        {isVoiceRoom ? (
          <VoiceRoom
            key={selectedRoom.slug}
            roomName={`haswolf-${selectedRoom.slug}`}
            nickname={nickname}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-7 py-6">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  Mesajlar yükleniyor...
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-400">
                      Bu kanalda henüz mesaj yok.
                    </p>

                    <p className="mt-2 text-sm text-zinc-600">
                      İlk mesajı sen gönder.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 bg-[#0a0c0e] p-5">
              {messageError && (
                <p className="mb-3 text-center text-sm text-red-400">
                  {messageError}
                </p>
              )}

              <div className="mx-auto flex max-w-5xl items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                <textarea
                  rows={1}
                  value={newMessage}
                  onChange={(event) =>
                    setNewMessage(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`#${selectedRoom.slug} odasına mesaj gönder`}
                  className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 outline-none placeholder:text-zinc-600"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  className="rounded-xl bg-[#d9aa4a] px-7 py-3 font-bold text-black transition hover:bg-[#efc668]"
                >
                  Gönder
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <MemberSidebar />
    </main>
  );
}