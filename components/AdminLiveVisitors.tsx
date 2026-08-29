"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Presence = { userId?: string | null; anonymous?: boolean; device?: string; visitorId?: string };

const PRESENCE_CHANNEL = "haswolf-site-visitors";

export default function AdminLiveVisitors({ enabled = true }: { enabled?: boolean }) {
  const [items, setItems] = useState<Presence[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel(PRESENCE_CHANNEL);

    const sync = () => {
      const state = channel.presenceState<Presence>();
      const flattened = Object.values(state).flat();
      const deduped = Array.from(new Map(flattened.map((item, index) => [item.visitorId || `${item.userId || "anon"}-${index}`, item])).values());
      setItems(deduped);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") window.setTimeout(sync, 250);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled]);

  const stats = useMemo(() => ({
    total: items.length,
    guests: items.filter((item) => item.anonymous !== false).length,
    mobile: items.filter((item) => item.device === "mobile").length,
  }), [items]);

  if (!enabled) return null;

  return (
    <aside className={`haswolf-live-orb ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="haswolf-live-orb__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${stats.total} kullanıcı çevrimiçi`}
      >
        <span className="haswolf-live-dot" />
        <b>{stats.total}</b>
      </button>
      {open && (
        <div className="haswolf-live-orb__panel">
          <header><small>CANLI DURUM</small><strong>{stats.total} kişi çevrimiçi</strong></header>
          <p><span>Misafir</span><b>{stats.guests}</b></p>
          <p><span>Mobil</span><b>{stats.mobile}</b></p>
        </div>
      )}
    </aside>
  );
}
