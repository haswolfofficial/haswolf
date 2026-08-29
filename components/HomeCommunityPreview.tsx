"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

type PreviewMessage = {
  id: string;
  roomId: string;
  roomName: string;
  roomIcon: string;
  nickname: string;
  message: string;
  createdAt: string;
};

type RoomRow = { id: string; name: string; slug: string; icon: string | null };
type MessageRow = { id: string; room_id: string; user_id: string; message: string; created_at: string };
type ProfileRow = { id: string; nickname: string | null };

const PUBLIC_ROOM_SLUGS = ["genel", "ephesus", "pergamon", "teos", "trade"];

function timeLabel(value: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function HomeCommunityPreview() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== "/") return;
    let active = true;

    async function loadPreview() {
      const { data: roomData } = await supabase
        .from("chat_rooms")
        .select("id,name,slug,icon")
        .in("slug", PUBLIC_ROOM_SLUGS);

      if (!active) return;
      const rooms = (roomData || []) as RoomRow[];
      const roomIds = rooms.map((room) => room.id);
      if (!roomIds.length) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const { data: messageData } = await supabase
        .from("chat_messages")
        .select("id,room_id,user_id,message,created_at")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!active) return;
      const rows = (messageData || []) as MessageRow[];
      const userIds = [...new Set(rows.map((row) => row.user_id))];
      let profiles: ProfileRow[] = [];
      if (userIds.length) {
        const { data } = await supabase.from("profiles").select("id,nickname").in("id", userIds);
        profiles = (data || []) as ProfileRow[];
      }

      const roomMap = new Map(rooms.map((room) => [room.id, room]));
      const profileMap = new Map(profiles.map((profile) => [profile.id, profile.nickname || "Üye"]));
      setMessages(
        rows.map((row) => {
          const room = roomMap.get(row.room_id);
          return {
            id: row.id,
            roomId: row.room_id,
            roomName: room?.name || "Sohbet",
            roomIcon: room?.icon || "💬",
            nickname: profileMap.get(row.user_id) || "Üye",
            message: row.message,
            createdAt: row.created_at,
          };
        }),
      );
      setLoading(false);
    }

    void loadPreview();
    const channel = supabase
      .channel("home-community-preview")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => void loadPreview())
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [pathname]);

  const visibleMessages = useMemo(() => messages.slice(0, 5), [messages]);
  if (pathname !== "/") return null;

  return (
    <aside className={`fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 xl:block ${open ? "w-[310px]" : "w-[58px]"}`}>
      <div className="overflow-hidden rounded-2xl border border-[#8d6829]/60 bg-[rgba(5,8,9,.94)] shadow-[0_18px_60px_rgba(0,0,0,.55),0_0_30px_rgba(217,170,74,.08)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 border-b border-[#8d6829]/35 bg-gradient-to-r from-[#17130c] to-[#0a0c0d] px-4 py-3 text-left"
          aria-expanded={open}
          aria-label={open ? "Canlı sohbet önizlemesini küçült" : "Canlı sohbet önizlemesini aç"}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-sm">💬<i className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0c0d] bg-emerald-400" /></span>
            {open && <span className="min-w-0"><b className="block truncate text-[13px] tracking-[.08em] text-[#f0c45d]">HASWOLF CANLI SOHBET</b><small className="text-[10px] text-zinc-500">Topluluktan son mesajlar</small></span>}
          </span>
          {open && <span className="text-zinc-500">‹</span>}
        </button>

        {open && (
          <>
            <div className="max-h-[350px] space-y-2 overflow-hidden p-3">
              {loading && <div className="py-8 text-center text-xs text-zinc-600">Mesajlar yükleniyor...</div>}
              {!loading && visibleMessages.length === 0 && <div className="py-8 text-center text-xs text-zinc-600">Henüz sohbet mesajı yok.</div>}
              {visibleMessages.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/[.06] bg-white/[.025] px-3 py-2.5 transition hover:border-[#d9aa4a]/25 hover:bg-[#d9aa4a]/[.04]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[11px] font-bold text-[#d9aa4a]">{item.roomIcon} {item.roomName} · {item.nickname}</span>
                    <span className="shrink-0 text-[9px] text-zinc-600">{timeLabel(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-300">{item.message}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#8d6829]/25 p-3">
              <a href="/topluluk" className="flex items-center justify-center gap-2 rounded-xl border border-[#d9aa4a]/45 bg-gradient-to-b from-[#2a2110] to-[#12100b] px-3 py-2.5 text-xs font-black tracking-[.04em] text-[#f1c75e] transition hover:border-[#f1c75e] hover:brightness-125">SOHBETE KATIL <span>→</span></a>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
