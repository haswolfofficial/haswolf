"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MemberSidebar from "./MemberSidebar";
import ChannelSidebar from "./ChannelSidebar";
import MessageBubble from "./MessageBubble";
import VoiceRoom from "./VoiceRoom";
import { supabase } from "@/lib/supabase";
import type { ChatMessage, ChatRoom } from "../../../types/chat";
import CommunityAdminTools from "./CommunityAdminTools";
import { moderateText } from "@/lib/moderation";

type CommunityLayoutProps = {
  nickname: string;
  currentUserId: string;
  canManageMembers: boolean;
  canChangeNicknames: boolean;
};

type RoomExtra = ChatRoom & {
  kind?: string;
  category?: string;
  guild_name?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

type DatabaseMessage = {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  reply_to_id?: string | null;
};

type ProfileRow = { id: string; nickname: string | null };

const fallbackRooms: ChatRoom[] = [
  { id: "news", name: "Duyurular", slug: "news", icon: "📢" },
  { id: "genel", name: "Genel", slug: "genel", icon: "💬" },
  { id: "ephesus", name: "Ephesus", slug: "ephesus", icon: "⚔️" },
  { id: "pergamon", name: "Pergamon", slug: "pergamon", icon: "🛡️" },
  { id: "teos", name: "Teos", slug: "teos", icon: "🔥" },
  { id: "trade", name: "Alım Satım", slug: "trade", icon: "💰" },
];

const UNREAD_KEY = "haswolf-chat-unread-v2";
const LAST_READ_PREFIX = "haswolf-chat-last-read:";
const CLIENT_FAST_WINDOW = 10_000;
const CLIENT_MINUTE_WINDOW = 60_000;

let sharedAudioContext: AudioContext | null = null;

async function getMessageAudioContext() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioContext) sharedAudioContext = new AudioContextClass();
  if (sharedAudioContext.state === "suspended") await sharedAudioContext.resume();
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
  } catch {}
}

function readUnread(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(UNREAD_KEY) || "{}"); } catch { return {}; }
}

function saveUnread(value: Record<string, number>) {
  try { localStorage.setItem(UNREAD_KEY, JSON.stringify(value)); } catch {}
}

export default function CommunityLayout({ nickname, currentUserId, canManageMembers, canChangeNicknames }: CommunityLayoutProps) {
  const [availableRooms, setAvailableRooms] = useState<ChatRoom[]>(fallbackRooms);
  const [selectedRoom, setSelectedRoom] = useState(fallbackRooms[0]);
  const [adminToolsOpen, setAdminToolsOpen] = useState(false);
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [mentionNotice, setMentionNotice] = useState("");
  const sendHistoryRef = useRef<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isVoiceRoom = selectedRoom.slug.startsWith("voice");
  const isAnnouncementRoom = selectedRoom.slug === "news";
  const announcementLocked = isAnnouncementRoom && !canManageMembers;

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("tr-TR");
    if (!q) return messages;
    return messages.filter((m) => `${m.nickname} ${m.message}`.toLocaleLowerCase("tr-TR").includes(q));
  }, [messages, searchQuery]);

  async function loadCommunityRooms() {
    const { data } = await supabase.from("chat_rooms").select("id,name,slug,icon,kind,category,guild_name,is_active,sort_order").order("sort_order");
    const next = (data || []).map((row: RoomExtra) => ({ ...row, icon: row.icon || "💬" })) as ChatRoom[];
    if (next.length) setAvailableRooms(next);
  }

  useEffect(() => {
    setUnreadCounts(readUnread());
    void loadCommunityRooms();
    const channel = supabase.channel("community-rooms-live").on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms" }, () => void loadCommunityRooms()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const channel = supabase.channel(`forced-room-${currentUserId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${currentUserId}` }, (payload) => {
      const slug = String((payload.new as { forced_room_slug?: string }).forced_room_slug || "");
      const room = availableRooms.find((item) => item.slug === slug);
      if (room) selectRoom(room);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [currentUserId, availableRooms]);

  function markRoomRead(slug: string, lastId?: string) {
    setUnreadCounts((current) => {
      const next = { ...current, [slug]: 0 };
      saveUnread(next);
      return next;
    });
    if (lastId) {
      try { localStorage.setItem(`${LAST_READ_PREFIX}${slug}`, lastId); } catch {}
    }
  }

  function selectRoom(room: ChatRoom) {
    const currentLast = messages[messages.length - 1]?.id;
    if (currentLast && !isVoiceRoom) markRoomRead(selectedRoom.slug, currentLast);
    setSelectedRoom(room);
    setSelectedMessageIds([]);
    setRoomMenuOpen(false);
    setMobileChannelsOpen(false);
    setMobileMembersOpen(false);
    setNewMessage("");
    setReplyTarget(null);
    setSearchQuery("");
    setMessageError("");
  }

  useEffect(() => {
    if (!currentUserId) return;
    let active = true;
    let heartbeatTimer: number | undefined;
    const channel = supabase.channel("haswolf-online-users", { config: { presence: { key: currentUserId } } });
    function syncPresence() {
      const state = channel.presenceState<{ userId?: string }>();
      const ids = new Set<string>([currentUserId]);
      Object.entries(state).forEach(([key, entries]) => {
        ids.add(key);
        entries.forEach((entry) => { if (entry.userId) ids.add(entry.userId); });
      });
      if (active) setOnlineUserIds([...ids]);
    }
    async function trackOnline() { await channel.track({ userId: currentUserId, nickname, onlineAt: new Date().toISOString() }); }
    channel.on("presence", { event: "sync" }, syncPresence).on("presence", { event: "join" }, syncPresence).on("presence", { event: "leave" }, syncPresence).subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await trackOnline();
      heartbeatTimer = window.setInterval(() => void trackOnline(), 25_000);
    });
    return () => {
      active = false;
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, nickname]);

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
      const { data: room, error: roomError } = await supabase.from("chat_rooms").select("id").eq("slug", selectedRoom.slug).maybeSingle();
      if (!active) return;
      if (roomError || !room) { setMessageError("Sohbet odası bulunamadı."); setMessagesLoading(false); return; }
      setSelectedRoomId(room.id);

      let databaseMessages: DatabaseMessage[] = [];
      let messagesError: { message?: string } | null = null;
      const withReply = await supabase.from("chat_messages").select("id,room_id,user_id,message,created_at,reply_to_id").eq("room_id", room.id).order("created_at", { ascending: true });
      if (withReply.error) {
        const fallback = await supabase.from("chat_messages").select("id,room_id,user_id,message,created_at").eq("room_id", room.id).order("created_at", { ascending: true });
        databaseMessages = (fallback.data || []) as DatabaseMessage[];
        messagesError = fallback.error;
      } else databaseMessages = (withReply.data || []) as DatabaseMessage[];
      if (!active) return;
      if (messagesError) { setMessageError("Mesajlar yüklenemedi."); setMessagesLoading(false); return; }

      const userIds = [...new Set(databaseMessages.map((item) => item.user_id))];
      let profiles: ProfileRow[] = [];
      if (userIds.length) {
        const { data: profileData } = await supabase.from("profiles").select("id,nickname").in("id", userIds);
        profiles = (profileData || []) as ProfileRow[];
      }
      const profileMap = new Map(profiles.map((profile) => [profile.id, profile.nickname || "Kullanıcı"]));
      const base = databaseMessages.map((item) => ({
        id: item.id,
        roomSlug: selectedRoom.slug,
        userId: item.user_id,
        nickname: profileMap.get(item.user_id) || "Kullanıcı",
        message: item.message,
        createdAt: new Date(item.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        createdAtIso: item.created_at,
        isMine: item.user_id === currentUserId,
        replyToId: item.reply_to_id || null,
      })) as ChatMessage[];
      const byId = new Map(base.map((m) => [m.id, m]));
      const enriched = base.map((m) => {
        const parent = m.replyToId ? byId.get(m.replyToId) : null;
        return { ...m, replyTo: parent ? { id: parent.id, nickname: parent.nickname, message: parent.message } : null };
      });
      let savedLastRead: string | null = null;
      try { savedLastRead = localStorage.getItem(`${LAST_READ_PREFIX}${selectedRoom.slug}`); } catch {}
      setLastReadMessageId(savedLastRead);
      setMessages(enriched);
      setMessagesLoading(false);
      window.setTimeout(() => markRoomRead(selectedRoom.slug, enriched[enriched.length - 1]?.id), 1200);
    }
    void loadMessages();
    return () => { active = false; };
  }, [selectedRoom.slug, isVoiceRoom, currentUserId]);

  useEffect(() => {
    if (!availableRooms.length) return;
    const channel = supabase.channel("haswolf-chat-global-events").on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async (payload) => {
      const inserted = payload.new as DatabaseMessage;
      const room = availableRooms.find((r) => r.id === inserted.room_id);
      const isCurrent = inserted.room_id === selectedRoomId;

      if (!isCurrent) {
        if (room && inserted.user_id !== currentUserId) {
          setUnreadCounts((current) => {
            const next = { ...current, [room.slug]: (current[room.slug] || 0) + 1 };
            saveUnread(next);
            return next;
          });
        }
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", inserted.user_id).maybeSingle();
      let replyTo: ChatMessage["replyTo"] = null;
      if (inserted.reply_to_id) {
        const parent = messages.find((m) => m.id === inserted.reply_to_id);
        if (parent) replyTo = { id: parent.id, nickname: parent.nickname, message: parent.message };
      }
      const incoming: ChatMessage = {
        id: inserted.id,
        roomSlug: selectedRoom.slug,
        userId: inserted.user_id,
        nickname: profile?.nickname || "Kullanıcı",
        message: inserted.message,
        createdAt: new Date(inserted.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        createdAtIso: inserted.created_at,
        isMine: inserted.user_id === currentUserId,
        replyToId: inserted.reply_to_id || null,
        replyTo,
      };
      setMessages((current) => current.some((m) => m.id === incoming.id) ? current : [...current, incoming]);

      if (inserted.user_id !== currentUserId) {
        const mentionToken = `@${nickname}`.toLocaleLowerCase("tr-TR");
        if (inserted.message.toLocaleLowerCase("tr-TR").includes(mentionToken)) {
          const notice = `${profile?.nickname || "Bir kullanıcı"} seni #${selectedRoom.slug} odasında etiketledi.`;
          setMentionNotice(notice);
          window.setTimeout(() => setMentionNotice(""), 5000);
          if ("Notification" in window && Notification.permission === "granted") new Notification("HASWOLF • Etiketlendin", { body: notice });
        }
        if (soundEnabled) void playMessageSound();
      }
    }).on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
      const deletedId = String((payload.old as { id?: string }).id || "");
      if (!deletedId) return;
      setMessages((current) => current.filter((m) => m.id !== deletedId));
      setSelectedMessageIds((current) => current.filter((id) => id !== deletedId));
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [availableRooms, selectedRoomId, selectedRoom.slug, currentUserId, nickname, soundEnabled, messages]);

  useEffect(() => {
    const unlock = () => void getMessageAudioContext();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileChannelsOpen || mobileMembersOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileChannelsOpen, mobileMembersOpen]);

  function clientRateLimited() {
    const now = Date.now();
    const history = sendHistoryRef.current.filter((time) => now - time <= CLIENT_MINUTE_WINDOW);
    sendHistoryRef.current = history;
    const fast = history.filter((time) => now - time <= CLIENT_FAST_WINDOW).length;
    if (fast >= 4) { setMessageError("Çok hızlı mesaj gönderiyorsun. Birkaç saniye bekle."); return true; }
    if (history.length >= 20) { setMessageError("Dakikalık mesaj sınırına ulaştın. Kısa bir süre bekle."); return true; }
    return false;
  }

  async function sendMessage() {
    const text = newMessage.trim();
    if (!text || isVoiceRoom || !selectedRoomId || !currentUserId || messageSending || announcementLocked || clientRateLimited()) return;
    setMessageSending(true);
    setMessageError("");

    const { data: moderationProfile, error: moderationError } = await supabase.from("profiles").select("is_banned,is_muted,muted_until").eq("id", currentUserId).maybeSingle();
    if (moderationError) { setMessageError("Üyelik durumu kontrol edilemedi."); setMessageSending(false); return; }
    const timedMuteActive = !!moderationProfile?.muted_until && new Date(moderationProfile.muted_until).getTime() > Date.now();
    if (moderationProfile?.is_banned) { setMessageError("Bu sohbetten yasaklandın."); setMessageSending(false); return; }
    if (moderationProfile?.is_muted || timedMuteActive) { setMessageError("Susturulduğun için şu anda mesaj gönderemezsin."); setMessageSending(false); return; }

    const moderation = moderateText(text);
    const payload: Record<string, unknown> = {
      room_id: selectedRoomId,
      user_id: currentUserId,
      message: moderation.masked,
      moderation_risk: moderation.risk,
      is_hidden: moderation.blocked,
    };
    if (replyTarget) payload.reply_to_id = replyTarget.id;

    let { error } = await supabase.from("chat_messages").insert(payload);
    if (error && replyTarget && /reply_to_id/i.test(error.message || "")) {
      delete payload.reply_to_id;
      const retry = await supabase.from("chat_messages").insert(payload);
      error = retry.error;
    }

    if (!error && moderation.risk > 0) {
      await supabase.from("moderation_queue").insert({ user_id: currentUserId, room_id: selectedRoomId, original_text: text, masked_text: moderation.masked, risk_score: moderation.risk, reasons: moderation.reasons, status: moderation.blocked ? "hidden" : "review" });
      if (moderation.blocked) setMessageError("Riskli mesaj gizlendi ve moderasyon kuyruğuna gönderildi.");
    }

    if (error) {
      setMessageError((error.message || "").includes("RATE_LIMIT") ? "Spam koruması devrede. Biraz bekleyip tekrar dene." : "Mesaj gönderilemedi.");
    } else {
      sendHistoryRef.current.push(Date.now());
      setNewMessage("");
      setReplyTarget(null);
      if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    }
    setMessageSending(false);
  }

  function startReply(message: ChatMessage) {
    setReplyTarget(message);
    setNewMessage((current) => current || `@${message.nickname} `);
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea[data-chat-composer]")?.focus(), 30);
  }

  async function reportMessage(message: ChatMessage) {
    const reason = window.prompt("Mesajı neden raporluyorsun? (spam, hakaret, dolandırıcılık, uygunsuz içerik vb.)", "Spam / uygunsuz içerik");
    if (!reason?.trim()) return;
    const { error } = await supabase.from("chat_message_reports").insert({ message_id: message.id, reporter_id: currentUserId, reason: reason.trim().slice(0, 300) });
    if (error) setMessageError(error.code === "23505" ? "Bu mesajı daha önce raporladın." : "Rapor gönderilemedi. Sohbet güncelleme SQL'ini çalıştırdığından emin ol.");
    else setMessageError("Rapor yönetime iletildi. Teşekkürler.");
  }

  function mentionUser(message: ChatMessage) {
    const token = `@${message.nickname} `;
    setNewMessage((current) => current.includes(token) ? current : `${current}${current && !current.endsWith(" ") ? " " : ""}${token}`);
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea[data-chat-composer]")?.focus(), 20);
  }

  function toggleMessageSelection(messageId: string) {
    setSelectedMessageIds((current) => current.includes(messageId) ? current.filter((id) => id !== messageId) : [...current, messageId]);
  }
  function toggleSelectAll() { setSelectedMessageIds((current) => current.length === messages.length ? [] : messages.map((m) => m.id)); }

  async function deleteOneMessage(messageId: string) {
    if (!canManageMembers || deleting || !window.confirm("Bu mesaj kalıcı olarak silinsin mi?")) return;
    setDeleting(true);
    const { data, error } = await supabase.from("chat_messages").delete().eq("id", messageId).select("id");
    if (error || !data?.length) setMessageError(error?.message || "Mesaj silinemedi.");
    else setMessages((current) => current.filter((m) => m.id !== messageId));
    setDeleting(false);
  }

  async function deleteSelectedMessages() {
    if (!canManageMembers || !selectedMessageIds.length || deleting || !window.confirm(`${selectedMessageIds.length} mesaj silinsin mi?`)) return;
    setDeleting(true);
    const { error } = await supabase.from("chat_messages").delete().in("id", selectedMessageIds);
    if (error) setMessageError(error.message); else { setMessages((current) => current.filter((m) => !selectedMessageIds.includes(m.id))); setSelectedMessageIds([]); }
    setDeleting(false);
  }

  async function deleteAllRoomMessages() {
    if (!canManageMembers || !selectedRoomId || !messages.length || deleting || !window.confirm(`#${selectedRoom.slug} odasındaki tüm mesajlar kalıcı olarak silinsin mi?`)) return;
    setDeleting(true);
    const { error } = await supabase.from("chat_messages").delete().eq("room_id", selectedRoomId);
    if (error) setMessageError(error.message); else { setMessages([]); setSelectedMessageIds([]); }
    setDeleting(false);
  }

  const dividerIndex = useMemo(() => {
    if (!lastReadMessageId || searchQuery) return -1;
    const index = messages.findIndex((m) => m.id === lastReadMessageId);
    return index >= 0 && index < messages.length - 1 ? index + 1 : -1;
  }, [lastReadMessageId, messages, searchQuery]);

  const sidebarProps = { rooms: availableRooms, selectedRoom, onSelectRoom: selectRoom, canManageRooms: canManageMembers, onManageRooms: () => setAdminToolsOpen(true), unreadCounts };

  return (
    <main className="flex h-[100dvh] min-h-0 overflow-hidden bg-[#050607] text-white">
      <div className="hidden shrink-0 md:block"><ChannelSidebar {...sidebarProps} /></div>

      {(mobileChannelsOpen || mobileMembersOpen) && <button type="button" aria-label="Menüyü kapat" onClick={() => { setMobileChannelsOpen(false); setMobileMembersOpen(false); }} className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm xl:hidden" />}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform shadow-2xl transition-transform duration-300 md:hidden ${mobileChannelsOpen ? "translate-x-0" : "-translate-x-full"}`}><ChannelSidebar {...sidebarProps} /></div>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-[#0a0c0e] px-3 py-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileChannelsOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-lg md:hidden">☰</button>
            <div className="relative min-w-0">
              <button type="button" onClick={() => setRoomMenuOpen((v) => !v)} className="flex max-w-full items-center gap-2 text-left" aria-expanded={roomMenuOpen}>
                <span className="truncate text-base font-bold sm:text-xl">{selectedRoom.icon} {selectedRoom.name}</span><span className="text-xs text-zinc-500">▼</span>
              </button>
              <p className="mt-0.5 truncate text-[10px] tracking-[0.15em] text-zinc-500 sm:text-xs">{isVoiceRoom ? "HASWOLF SES KANALI" : "HASWOLF SOHBET ODALARI"}</p>
              {roomMenuOpen && <div className="absolute left-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-xl border border-[#765625] bg-[#111315] p-2 shadow-2xl">
                {availableRooms.map((room) => <button key={room.id} type="button" onClick={() => selectRoom(room)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${selectedRoom.slug === room.slug ? "bg-[#d9aa4a]/15 text-[#e5b64e]" : "text-zinc-300 hover:bg-zinc-900"}`}><span>{room.icon}</span><span className="flex-1">{room.name}</span>{(unreadCounts[room.slug] || 0) > 0 && selectedRoom.slug !== room.slug && <span className="rounded-full bg-[#d9aa4a] px-1.5 text-[10px] font-black text-black">{unreadCounts[room.slug]}</span>}</button>)}
              </div>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isVoiceRoom && <button type="button" onClick={() => setSearchOpen((v) => !v)} title="Mesaj ara" className={`rounded-xl border px-3 py-2 text-sm ${searchOpen ? "border-[#d9aa4a] bg-[#d9aa4a]/10 text-[#e5b64e]" : "border-zinc-700 bg-zinc-900"}`}>⌕</button>}
            {canManageMembers && <button type="button" onClick={() => setAdminToolsOpen(true)} className="haswolf-room-admin-trigger">⚙ Odalar</button>}
            {!isVoiceRoom && <button type="button" onClick={() => { const next = !soundEnabled; setSoundEnabled(next); if (next) void playMessageSound(); }} className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">{soundEnabled ? "🔔" : "🔕"}</button>}
            <button type="button" onClick={() => setMobileMembersOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-lg xl:hidden">👥</button>
          </div>
        </header>

        {searchOpen && !isVoiceRoom && <div className="border-b border-zinc-800 bg-[#080a0c] px-3 py-2 sm:px-5"><div className="mx-auto flex max-w-5xl items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3"><span className="text-zinc-500">⌕</span><input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`#${selectedRoom.slug} içinde mesaj veya kullanıcı ara`} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"/><span className="text-[11px] text-zinc-500">{filteredMessages.length}/{messages.length}</span><button type="button" onClick={() => { setSearchQuery(""); setSearchOpen(false); }} className="text-zinc-500 hover:text-white">✕</button></div></div>}

        {mentionNotice && <div className="border-b border-amber-400/30 bg-amber-300/10 px-4 py-2 text-center text-xs font-bold text-amber-200">🔔 {mentionNotice}</div>}

        {canManageMembers && !isVoiceRoom && <div className="flex flex-wrap items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-3 py-2 sm:px-5"><span className="mr-1 text-xs font-bold uppercase tracking-wider text-[#d9aa4a]">Admin mesaj yönetimi</span><button type="button" onClick={toggleSelectAll} disabled={!messages.length} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs disabled:opacity-40">{selectedMessageIds.length === messages.length && messages.length ? "Seçimi kaldır" : "Tümünü seç"}</button><button type="button" onClick={deleteSelectedMessages} disabled={!selectedMessageIds.length || deleting} className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs text-red-300 disabled:opacity-40">Seçilenleri sil ({selectedMessageIds.length})</button><button type="button" onClick={deleteAllRoomMessages} disabled={!messages.length || deleting} className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">Odadaki tüm mesajları sil</button></div>}

        {isVoiceRoom ? <div className="min-h-0 flex-1 overflow-hidden"><VoiceRoom key={selectedRoom.slug} roomName={`haswolf-${selectedRoom.slug}`} nickname={nickname} currentUserId={currentUserId} canManageMembers={canManageMembers} /></div> : <>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:px-7">
            {messagesLoading ? <div className="flex h-full items-center justify-center text-sm text-zinc-500">Mesajlar yükleniyor...</div> : filteredMessages.length ? <div className="space-y-4 sm:space-y-6">
              {filteredMessages.map((message) => {
                const rawIndex = messages.findIndex((m) => m.id === message.id);
                return <div key={message.id}>
                  {rawIndex === dividerIndex && <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-amber-400/40"/><span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-amber-300">Buradan sonrası yeni mesajlar</span><div className="h-px flex-1 bg-amber-400/40"/></div>}
                  <div className="flex items-start gap-3">
                    {canManageMembers && <label className="mt-4 flex cursor-pointer items-center"><input type="checkbox" checked={selectedMessageIds.includes(message.id)} onChange={() => toggleMessageSelection(message.id)} className="h-4 w-4 accent-[#d9aa4a]" /></label>}
                    <div className="min-w-0 flex-1"><MessageBubble message={message} currentNickname={nickname} onReply={startReply} onReport={reportMessage} /><div className={`mt-1 flex ${message.isMine ? "justify-end" : "ml-[3.25rem]"}`}><button type="button" onClick={() => mentionUser(message)} className="text-[10px] text-zinc-700 hover:text-sky-300">@ Etiketle</button></div></div>
                    {canManageMembers && <button type="button" onClick={() => deleteOneMessage(message.id)} className="mt-3 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-950/50">Sil</button>}
                  </div>
                </div>;
              })}
              <div ref={messagesEndRef}/>
            </div> : <div className="flex h-full items-center justify-center text-center"><div><p className="text-lg font-bold text-zinc-400">{searchQuery ? "Aramayla eşleşen mesaj yok." : "Bu kanalda henüz mesaj yok."}</p><p className="mt-2 text-sm text-zinc-600">{searchQuery ? "Farklı bir kelime dene." : "İlk mesajı sen gönder."}</p></div></div>}
          </div>

          <div className="shrink-0 border-t border-zinc-800 bg-[#0a0c0e] p-2.5 sm:p-4">
            {replyTarget && <div className="mx-auto mb-2 flex max-w-5xl items-center justify-between gap-3 rounded-xl border border-[#d9aa4a]/30 bg-[#d9aa4a]/[.06] px-3 py-2"><div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-wider text-[#e5b64e]">↩ {replyTarget.nickname} kişisine yanıt</p><p className="truncate text-xs text-zinc-400">{replyTarget.message}</p></div><button type="button" onClick={() => setReplyTarget(null)} className="text-zinc-500 hover:text-white">✕</button></div>}
            {messageError && <p className={`mb-2 text-center text-xs ${messageError.includes("iletildi") ? "text-emerald-400" : "text-red-400"}`}>{messageError}</p>}
            <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2 sm:gap-3 sm:p-3">
              <textarea data-chat-composer rows={1} value={newMessage} disabled={!selectedRoomId || messageSending || announcementLocked} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder={announcementLocked ? "Duyurulara yalnızca Kurucu ve Yönetici mesaj gönderebilir." : `#${selectedRoom.slug} odasına mesaj gönder • @isim ile etiketle`} className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-zinc-600 disabled:opacity-50" />
              <button type="button" disabled={!newMessage.trim() || !selectedRoomId || messageSending || announcementLocked} onClick={() => void sendMessage()} className="shrink-0 rounded-lg bg-[#d9aa4a] px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50 sm:px-7">{messageSending ? "..." : "Gönder"}</button>
            </div>
            <div className="mx-auto mt-2 flex max-w-5xl items-center justify-between px-1 text-[10px] text-zinc-600"><span>↩ Yanıtla • @ Etiketle • ⚑ Raporla</span><span>Spam koruması aktif</span></div>
          </div>
        </>}
      </section>

      <div className="hidden shrink-0 xl:block"><MemberSidebar currentUserId={currentUserId} canManageMembers={canManageMembers} canChangeNicknames={canChangeNicknames} onlineUserIds={onlineUserIds} activeVoiceRoomName={isVoiceRoom ? `haswolf-${selectedRoom.slug}` : undefined} /></div>
      <div className={`fixed inset-y-0 right-0 z-50 w-[min(31rem,94vw)] transform shadow-2xl transition-transform duration-300 xl:hidden ${mobileMembersOpen ? "translate-x-0" : "translate-x-full"}`}><div className="relative h-full [&>aside]:block [&>aside]:h-full [&>aside]:w-full"><button type="button" onClick={() => setMobileMembersOpen(false)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">✕</button><MemberSidebar currentUserId={currentUserId} canManageMembers={canManageMembers} canChangeNicknames={canChangeNicknames} onlineUserIds={onlineUserIds} activeVoiceRoomName={isVoiceRoom ? `haswolf-${selectedRoom.slug}` : undefined} /></div></div>

      {adminToolsOpen && canManageMembers && <CommunityAdminTools rooms={availableRooms} onRoomsChanged={loadCommunityRooms} onForceCurrentRoom={(room) => { selectRoom(room); setAdminToolsOpen(false); }} />}
    </main>
  );
}