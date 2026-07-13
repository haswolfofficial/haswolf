"use client";

import { useEffect, useState } from "react";
import MemberSidebar from "./MemberSidebar";
import ChannelSidebar from "./ChannelSidebar";
import MessageBubble from "./MessageBubble";
import VoiceRoom from "./VoiceRoom";
import { supabase } from "@/lib/supabase";
import type { ChatMessage, ChatRoom } from "../../../types/chat";
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
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState("");

  const [mobileChannelsOpen, setMobileChannelsOpen] =
    useState(false);
  const [mobileMembersOpen, setMobileMembersOpen] =
    useState(false);

  const isVoiceRoom = selectedRoom.slug.startsWith("voice");

  function selectRoom(room: ChatRoom) {
    setSelectedRoom(room);
    setMobileChannelsOpen(false);
    setMobileMembersOpen(false);
    setNewMessage("");
    setMessageError("");
  }

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

      const userIds = [
        ...new Set(rows.map((item) => item.user_id)),
      ];

      let profiles: ProfileRow[] = [];

      if (userIds.length > 0) {
        const { data: profileData, error: profilesError } =
          await supabase
            .from("profiles")
            .select("id, nickname")
            .in("id", userIds);

        if (profilesError) {
          console.error(
            "Kullanıcı mahlasları alınamadı:",
            profilesError
          );
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

      const formattedMessages: ChatMessage[] = rows.map(
        (item) => ({
          id: item.id,
          roomSlug: selectedRoom.slug,
          nickname:
            profileMap.get(item.user_id) || "Kullanıcı",
          message: item.message,
          createdAt: new Date(
            item.created_at
          ).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMine: item.user_id === currentUserId,
        })
      );

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
            nickname:
              profile?.nickname || "Kullanıcı",
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
              (message) =>
                message.id === incomingMessage.id
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

  useEffect(() => {
    function closeMenusWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileChannelsOpen(false);
        setMobileMembersOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      closeMenusWithEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        closeMenusWithEscape
      );
    };
  }, []);

  useEffect(() => {
    const menuOpen =
      mobileChannelsOpen || mobileMembersOpen;

    document.body.style.overflow = menuOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileChannelsOpen, mobileMembersOpen]);

  async function sendMessage() {
    const text = newMessage.trim();

    if (
      !text ||
      isVoiceRoom ||
      !selectedRoomId ||
      !currentUserId ||
      messageSending
    ) {
      return;
    }

    setMessageSending(true);
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
      setMessageSending(false);
      return;
    }

    setNewMessage("");
    setMessageSending(false);
  }

  return (
    <main className="flex h-[100dvh] min-h-0 overflow-hidden bg-[#050607] text-white">
      {/* Masaüstü kanal menüsü */}
      <div className="hidden shrink-0 md:block">
        <ChannelSidebar
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={selectRoom}
        />
      </div>

      {/* Mobil karartma alanı */}
      {(mobileChannelsOpen || mobileMembersOpen) && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => {
            setMobileChannelsOpen(false);
            setMobileMembersOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm xl:hidden"
        />
      )}

      {/* Mobil kanal menüsü */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform shadow-2xl transition-transform duration-300 md:hidden ${
          mobileChannelsOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Kanal menüsünü kapat"
          onClick={() => setMobileChannelsOpen(false)}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-lg text-zinc-300"
        >
          ✕
        </button>

        <ChannelSidebar
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={selectRoom}
        />
      </div>

      {/* Orta içerik */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-[#0a0c0e] px-3 sm:h-20 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              title="Kanallar"
              aria-label="Kanalları aç"
              onClick={() => {
                setMobileChannelsOpen(true);
                setMobileMembersOpen(false);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-lg transition hover:border-[#d9aa4a] md:hidden"
            >
              ☰
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold sm:text-xl">
                {selectedRoom.icon} {selectedRoom.name}
              </h1>

              <p className="mt-0.5 truncate text-[10px] tracking-[0.15em] text-zinc-500 sm:mt-1 sm:text-xs sm:tracking-widest">
                {isVoiceRoom
                  ? "HASWOLF SES KANALI"
                  : "HASWOLF COMMUNITY"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {!isVoiceRoom && (
              <>
                <button
                  type="button"
                  title="Emoji"
                  className="hidden rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 transition hover:border-[#d9aa4a] sm:block"
                >
                  😀
                </button>

                <button
                  type="button"
                  title="Dosya ekle"
                  className="hidden rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 transition hover:border-[#d9aa4a] sm:block"
                >
                  📎
                </button>
              </>
            )}

            <button
              type="button"
              title="Üyeler"
              aria-label="Üyeleri aç"
              onClick={() => {
                setMobileMembersOpen(true);
                setMobileChannelsOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-lg transition hover:border-[#d9aa4a] xl:hidden"
            >
              👥
            </button>
          </div>
        </header>

        {isVoiceRoom ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <VoiceRoom
              key={selectedRoom.slug}
              roomName={`haswolf-${selectedRoom.slug}`}
              nickname={nickname}
            />
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  Mesajlar yükleniyor...
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-4">
                  <div className="text-center">
                    <p className="text-base font-bold text-zinc-400 sm:text-lg">
                      Bu kanalda henüz mesaj yok.
                    </p>

                    <p className="mt-2 text-sm text-zinc-600">
                      İlk mesajı sen gönder.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-zinc-800 bg-[#0a0c0e] p-2.5 sm:p-4 lg:p-5">
              {messageError && (
                <p className="mb-2 text-center text-xs text-red-400 sm:mb-3 sm:text-sm">
                  {messageError}
                </p>
              )}

              <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2 sm:gap-3 sm:rounded-2xl sm:p-3">
                <textarea
                  rows={1}
                  value={newMessage}
                  disabled={
                    !selectedRoomId || messageSending
                  }
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
                  className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 sm:max-h-40 sm:min-h-11 sm:text-base"
                />

                <button
                  type="button"
                  disabled={
                    !newMessage.trim() ||
                    !selectedRoomId ||
                    messageSending
                  }
                  onClick={sendMessage}
                  className="shrink-0 rounded-lg bg-[#d9aa4a] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#efc668] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:px-7 sm:py-3 sm:text-base"
                >
                  {messageSending ? "..." : "Gönder"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Masaüstü üye paneli */}
      <div className="hidden shrink-0 xl:block">
        <MemberSidebar />
      </div>

            {/* Telefon ve tablet üye paneli */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[min(18rem,88vw)] transform shadow-2xl transition-transform duration-300 xl:hidden ${
          mobileMembersOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="relative h-full [&>aside]:block [&>aside]:h-full [&>aside]:w-full">
          <button
            type="button"
            aria-label="Üye panelini kapat"
            onClick={() => setMobileMembersOpen(false)}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-lg text-zinc-300"
          >
            ✕
          </button>

          <MemberSidebar />
        </div>
      </div>
    </main>
  );
}