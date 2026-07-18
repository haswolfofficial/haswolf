"use client";

import { useEffect, useRef, useState } from "react";
import MemberSidebar from "./MemberSidebar";
import ChannelSidebar from "./ChannelSidebar";
import MessageBubble from "./MessageBubble";
import VoiceRoom from "./VoiceRoom";
import { supabase } from "@/lib/supabase";
import type { ChatMessage, ChatRoom } from "../../../types/chat";
import CommunityAdminTools from "./CommunityAdminTools";

type CommunityLayoutProps = {
  nickname: string;
  currentUserId: string;
  canManageMembers: boolean;
  canChangeNicknames: boolean;
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

const fallbackRooms: ChatRoom[] = [
  {id:"news",name:"Duyurular",slug:"news",icon:"📢"},
  {id:"genel",name:"Genel",slug:"genel",icon:"💬"},
  {id:"ephesus",name:"Ephesus",slug:"ephesus",icon:"⚔️"},
  {id:"pergamon",name:"Pergamon",slug:"pergamon",icon:"🛡️"},
  {id:"teos",name:"Teos",slug:"teos",icon:"🔥"},
  {id:"trade",name:"Alım Satım",slug:"trade",icon:"💰"},
];
let sharedAudioContext: AudioContext | null = null;

async function getMessageAudioContext() {
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }

  if (sharedAudioContext.state === "suspended") {
    await sharedAudioContext.resume();
  }

  return sharedAudioContext;
}

async function playMessageSound() {
  try {
    const context = await getMessageAudioContext();
    if (!context) return;

    const start = context.currentTime;
    const gain = context.createGain();
    const first = context.createOscillator();
    const second = context.createOscillator();

    first.type = "sine";
    second.type = "sine";
    first.frequency.setValueAtTime(740, start);
    second.frequency.setValueAtTime(980, start + 0.09);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

    first.connect(gain);
    second.connect(gain);
    gain.connect(context.destination);

    first.start(start);
    first.stop(start + 0.11);
    second.start(start + 0.09);
    second.stop(start + 0.22);
  } catch {
    // Tarayıcı sesi engellese bile sohbet çalışmaya devam eder.
  }
}

export default function CommunityLayout({
  nickname,
  currentUserId,
  canManageMembers,
  canChangeNicknames,
}: CommunityLayoutProps) {
  const [availableRooms,setAvailableRooms]=useState<ChatRoom[]>(fallbackRooms);
  const [selectedRoom, setSelectedRoom] = useState(fallbackRooms[0]);
  const [adminToolsOpen,setAdminToolsOpen]=useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [wolfVisible, setWolfVisible] = useState(false);

  const isVoiceRoom = selectedRoom.slug.startsWith("voice");
  const isAnnouncementRoom = selectedRoom.slug === "news";
  const announcementLocked = isAnnouncementRoom && !canManageMembers;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadCommunityRooms(){
    const {data}=await supabase.from("chat_rooms").select("id,name,slug,icon,kind,category,guild_name,is_active,sort_order").order("sort_order");
    const next=(data||[]).map((row:any)=>({...row,icon:row.icon||"💬"})) as ChatRoom[];
    if(next.length)setAvailableRooms(next);
  }
  useEffect(()=>{
    void loadCommunityRooms();
    const channel=supabase.channel("community-rooms-live").on("postgres_changes",{event:"*",schema:"public",table:"chat_rooms"},()=>void loadCommunityRooms()).subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[]);
  useEffect(()=>{
    const channel=supabase.channel(`forced-room-${currentUserId}`).on("postgres_changes",{event:"UPDATE",schema:"public",table:"profiles",filter:`id=eq.${currentUserId}`},(payload)=>{
      const slug=String((payload.new as any).forced_room_slug||"");
      const room=availableRooms.find(item=>item.slug===slug);if(room)selectRoom(room);
    }).subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[currentUserId,availableRooms]);

  function selectRoom(room: ChatRoom) {
    setSelectedRoom(room);
    setSelectedMessageIds([]);
    setRoomMenuOpen(false);
    setMobileChannelsOpen(false);
    setMobileMembersOpen(false);
    setNewMessage("");
    setMessageError("");
  }


  useEffect(() => {
    if (!currentUserId) return;

    let active = true;
    let heartbeatTimer: number | undefined;

    setOnlineUserIds((current) =>
      current.includes(currentUserId) ? current : [...current, currentUserId]
    );

    const channel = supabase.channel("haswolf-online-users", {
      config: {
        presence: { key: currentUserId },
      },
    });

    function syncPresence() {
      const state = channel.presenceState<{ userId?: string }>();
      const ids = new Set<string>([currentUserId]);

      Object.entries(state).forEach(([key, entries]) => {
        ids.add(key);

        entries.forEach((entry) => {
          if (entry.userId) ids.add(entry.userId);
        });
      });

      if (active) setOnlineUserIds([...ids]);
    }

    async function trackOnline() {
      await channel.track({
        userId: currentUserId,
        nickname,
        onlineAt: new Date().toISOString(),
      });
    }

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        await trackOnline();

        heartbeatTimer = window.setInterval(() => {
          void trackOnline();
        }, 25_000);
      });

    return () => {
      active = false;

      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer);
      }

      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, nickname]);

  useEffect(() => {
    const unlock = () => {
      void getMessageAudioContext();
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    let hideTimer: number | undefined;

    function scheduleWolf() {
      const wait = 35_000 + Math.floor(Math.random() * 35_000);

      return window.setTimeout(() => {
        setWolfVisible(true);
        hideTimer = window.setTimeout(() => setWolfVisible(false), 4_500);
        wolfTimer = scheduleWolf();
      }, wait);
    }

    let wolfTimer = scheduleWolf();

    return () => {
      window.clearTimeout(wolfTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
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
      setSelectedMessageIds([]);

      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("slug", selectedRoom.slug)
        .maybeSingle();

      if (!active) return;

      if (roomError || !room) {
        setMessageError("Sohbet odası bulunamadı.");
        setMessagesLoading(false);
        return;
      }

      setSelectedRoomId(room.id);

      const { data: databaseMessages, error: messagesError } = await supabase
        .from("chat_messages")
        .select("id, room_id, user_id, message, created_at")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (messagesError) {
        setMessageError("Mesajlar yüklenemedi.");
        setMessagesLoading(false);
        return;
      }

      const rows = (databaseMessages || []) as DatabaseMessage[];
      const userIds = [...new Set(rows.map((item) => item.user_id))];
      let profiles: ProfileRow[] = [];

      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", userIds);

        profiles = (profileData || []) as ProfileRow[];
      }

      const profileMap = new Map(
        profiles.map((profile) => [
          profile.id,
          profile.nickname || "Kullanıcı",
        ])
      );

      setMessages(
        rows.map((item) => ({
          id: item.id,
          roomSlug: selectedRoom.slug,
          nickname: profileMap.get(item.user_id) || "Kullanıcı",
          message: item.message,
          createdAt: new Date(item.created_at).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMine: item.user_id === currentUserId,
        }))
      );
      setMessagesLoading(false);
    }

    loadMessages();

    return () => {
      active = false;
    };
  }, [selectedRoom.slug, isVoiceRoom, currentUserId]);

  useEffect(() => {
    if (!selectedRoomId || isVoiceRoom) return;

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
            createdAt: new Date(inserted.created_at).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMine: inserted.user_id === currentUserId,
          };

          setMessages((current) => {
            if (current.some((message) => message.id === incomingMessage.id)) {
              return current;
            }
            return [...current, incomingMessage];
          });

          if (soundEnabled) {
            void playMessageSound();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const deletedId = String((payload.old as { id?: string }).id || "");
          if (!deletedId) return;
          setMessages((current) =>
            current.filter((message) => message.id !== deletedId)
          );
          setSelectedMessageIds((current) =>
            current.filter((id) => id !== deletedId)
          );
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
    soundEnabled,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    document.body.style.overflow =
      mobileChannelsOpen || mobileMembersOpen ? "hidden" : "";

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
      messageSending ||
      announcementLocked
    ) {
      return;
    }

    setMessageSending(true);
    setMessageError("");

    const { data: moderationProfile, error: moderationError } = await supabase
      .from("profiles")
      .select("is_banned,is_muted,muted_until")
      .eq("id", currentUserId)
      .maybeSingle();

    if (moderationError) {
      setMessageError("Üyelik durumu kontrol edilemedi.");
      setMessageSending(false);
      return;
    }

    const timedMuteActive =
      !!moderationProfile?.muted_until &&
      new Date(moderationProfile.muted_until).getTime() > Date.now();

    if (moderationProfile?.is_banned) {
      setMessageError("Bu sohbetten yasaklandın.");
      setMessageSending(false);
      return;
    }

    if (moderationProfile?.is_muted || timedMuteActive) {
      setMessageError("Susturulduğun için şu anda mesaj gönderemezsin.");
      setMessageSending(false);
      return;
    }

    const { error } = await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      user_id: currentUserId,
      message: text,
    });

    if (error) {
      setMessageError("Mesaj gönderilemedi.");
    } else {
      setNewMessage("");
    }

    setMessageSending(false);
  }

  function toggleMessageSelection(messageId: string) {
    setSelectedMessageIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId]
    );
  }

  function toggleSelectAll() {
    setSelectedMessageIds((current) =>
      current.length === messages.length ? [] : messages.map((message) => message.id)
    );
  }

  async function deleteOneMessage(messageId: string) {
    if (!canManageMembers || deleting) return;

    const confirmed = window.confirm("Bu mesaj kalıcı olarak silinsin mi?");
    if (!confirmed) return;

    setDeleting(true);
    setMessageError("");

    const { data: deletedRows, error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId)
      .select("id");

    if (error) {
      setMessageError(`Mesaj silinemedi: ${error.message}`);
    } else if (!deletedRows || deletedRows.length === 0) {
      setMessageError("Mesaj veritabanından silinemedi. Yönetici silme yetkisini kontrol et.");
    } else {
      setMessages((current) =>
        current.filter((message) => message.id !== messageId)
      );
      setSelectedMessageIds((current) =>
        current.filter((id) => id !== messageId)
      );
    }

    setDeleting(false);
  }

  async function deleteSelectedMessages() {
    if (!canManageMembers || selectedMessageIds.length === 0 || deleting) return;

    const confirmed = window.confirm(
      `${selectedMessageIds.length} mesaj silinsin mi? Bu işlem geri alınamaz.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessageError("");

    const { data: deletedRows, error } = await supabase
      .from("chat_messages")
      .delete()
      .in("id", selectedMessageIds)
      .select("id");

    if (error) {
      setMessageError(`Mesajlar silinemedi: ${error.message}`);
    } else if (!deletedRows || deletedRows.length !== selectedMessageIds.length) {
      setMessageError("Bazı mesajlar veritabanından silinemedi. Yönetici yetkisini kontrol et.");
    } else {
      setMessages((current) =>
        current.filter((message) => !selectedMessageIds.includes(message.id))
      );
      setSelectedMessageIds([]);
    }

    setDeleting(false);
  }

  async function deleteAllRoomMessages() {
    if (!canManageMembers || !selectedRoomId || messages.length === 0 || deleting) return;

    const confirmed = window.confirm(
      `#${selectedRoom.slug} odasındaki tüm mesajlar kalıcı olarak silinsin mi?`
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessageError("");

    const { data: deletedRows, error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("room_id", selectedRoomId)
      .select("id");

    if (error) {
      setMessageError(`Odadaki mesajlar silinemedi: ${error.message}`);
    } else if (!deletedRows || deletedRows.length === 0) {
      setMessageError("Mesajlar veritabanından silinemedi. Yönetici silme yetkisini kontrol et.");
    } else {
      setMessages([]);
      setSelectedMessageIds([]);
    }

    setDeleting(false);
  }

  return (
    <main className="flex h-[100dvh] min-h-0 overflow-hidden bg-[#050607] text-white">
      <div className="hidden shrink-0 md:block">
        <ChannelSidebar rooms={availableRooms} selectedRoom={selectedRoom} onSelectRoom={selectRoom} canManageRooms={canManageMembers} onManageRooms={() => setAdminToolsOpen(true)} />
      </div>

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

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform shadow-2xl transition-transform duration-300 md:hidden ${
          mobileChannelsOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChannelSidebar rooms={availableRooms} selectedRoom={selectedRoom} onSelectRoom={selectRoom} canManageRooms={canManageMembers} onManageRooms={() => setAdminToolsOpen(true)} />
      </div>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-[#0a0c0e] px-3 py-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileChannelsOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-lg md:hidden"
            >
              ☰
            </button>

            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => setRoomMenuOpen((value) => !value)}
                className="flex max-w-full items-center gap-2 text-left"
                aria-expanded={roomMenuOpen}
              >
                <span className="truncate text-base font-bold sm:text-xl">
                  {selectedRoom.icon} {selectedRoom.name}
                </span>
                <span className="text-xs text-zinc-500">▼</span>
              </button>
              <p className="mt-0.5 truncate text-[10px] tracking-[0.15em] text-zinc-500 sm:text-xs">
                {isVoiceRoom ? "HASWOLF SES KANALI" : "HASWOLF SOHBET ODALARI"}
              </p>

              {roomMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-xl border border-[#765625] bg-[#111315] p-2 shadow-2xl">
                  {availableRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => selectRoom(room)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                        selectedRoom.slug === room.slug
                          ? "bg-[#d9aa4a]/15 text-[#e5b64e]"
                          : "text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      <span>{room.icon}</span>
                      <span>{room.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canManageMembers && <button type="button" onClick={() => setAdminToolsOpen(true)} className="haswolf-room-admin-trigger">⚙ Odalar</button>}
            {!isVoiceRoom && (
              <button
                type="button"
                onClick={() => {
                  const nextValue = !soundEnabled;
                  setSoundEnabled(nextValue);
                  if (nextValue) void playMessageSound();
                }}
                title={soundEnabled ? "Mesaj sesini kapat" : "Mesaj sesini aç"}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm transition hover:border-[#d9aa4a]"
              >
                {soundEnabled ? "🔔" : "🔕"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMembersOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-lg xl:hidden"
            >
              👥
            </button>
          </div>
        </header>

        {canManageMembers && !isVoiceRoom && (
          <div className="flex flex-wrap items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-3 py-2 sm:px-5">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-[#d9aa4a]">
              Admin mesaj yönetimi
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={messages.length === 0}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs disabled:opacity-40"
            >
              {selectedMessageIds.length === messages.length && messages.length > 0
                ? "Seçimi kaldır"
                : "Tümünü seç"}
            </button>
            <button
              type="button"
              onClick={deleteSelectedMessages}
              disabled={selectedMessageIds.length === 0 || deleting}
              className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs text-red-300 disabled:opacity-40"
            >
              Seçilenleri sil ({selectedMessageIds.length})
            </button>
            <button
              type="button"
              onClick={deleteAllRoomMessages}
              disabled={messages.length === 0 || deleting}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Odadaki tüm mesajları sil
            </button>
          </div>
        )}

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
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:px-7">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  Mesajlar yükleniyor...
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      {canManageMembers && (
                        <label className="mt-4 flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={selectedMessageIds.includes(message.id)}
                            onChange={() => toggleMessageSelection(message.id)}
                            className="h-4 w-4 accent-[#d9aa4a]"
                            aria-label={`${message.nickname} mesajını seç`}
                          />
                        </label>
                      )}
                      <div className="min-w-0 flex-1">
                        <MessageBubble message={message} />
                      </div>
                      {canManageMembers && (
                        <button
                          type="button"
                          onClick={() => deleteOneMessage(message.id)}
                          className="mt-3 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-950/50"
                          title="Bu mesajı sil"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
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

            <div className="shrink-0 border-t border-zinc-800 bg-[#0a0c0e] p-2.5 sm:p-4">
              {messageError && (
                <p className="mb-2 text-center text-xs text-red-400">
                  {messageError}
                </p>
              )}

              <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2 sm:gap-3 sm:p-3">
                <textarea
                  rows={1}
                  value={newMessage}
                  disabled={!selectedRoomId || messageSending || announcementLocked}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    announcementLocked
                      ? "Duyurulara yalnızca Kurucu ve Yönetici mesaj gönderebilir."
                      : `#${selectedRoom.slug} odasına mesaj gönder`
                  }
                  className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-zinc-600 disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={!newMessage.trim() || !selectedRoomId || messageSending || announcementLocked}
                  onClick={sendMessage}
                  className="shrink-0 rounded-lg bg-[#d9aa4a] px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50 sm:px-7"
                >
                  {messageSending ? "..." : "Gönder"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="hidden shrink-0 xl:block">
        <MemberSidebar currentUserId={currentUserId} canManageMembers={canManageMembers} canChangeNicknames={canChangeNicknames} onlineUserIds={onlineUserIds} />
      </div>

      <div
        className={`fixed inset-y-0 right-0 z-50 w-[min(31rem,94vw)] transform shadow-2xl transition-transform duration-300 xl:hidden ${
          mobileMembersOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative h-full [&>aside]:block [&>aside]:h-full [&>aside]:w-full">
          <button
            type="button"
            onClick={() => setMobileMembersOpen(false)}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900"
          >
            ✕
          </button>
          <MemberSidebar currentUserId={currentUserId} canManageMembers={canManageMembers} canChangeNicknames={canChangeNicknames} onlineUserIds={onlineUserIds} />
        </div>
      </div>

      {adminToolsOpen && canManageMembers && <CommunityAdminTools rooms={availableRooms} onRoomsChanged={loadCommunityRooms} onForceCurrentRoom={(room) => { selectRoom(room); setAdminToolsOpen(false); }} />}

      {wolfVisible && (
        <div
          aria-hidden="true"
          className="haswolf-wolf-cameo pointer-events-none fixed bottom-16 left-0 z-[80] text-6xl drop-shadow-[0_0_18px_rgba(217,170,74,0.75)]"
        >
          🐺
        </div>
      )}
    </main>
  );
}
