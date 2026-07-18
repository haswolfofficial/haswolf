"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Deal = {
  id: number;
  name: string;
  price: number;
  old_price: number | null;
  server: string;
  category: "item" | "yang" | "dc" | "account";
};

const KEY = "haswolf_seen_discount_ids_v3";

function dealUrl(deal: Deal) {
  const params = new URLSearchParams({
    market: deal.category,
    server: deal.server,
    product: String(deal.id),
  });
  return `/?${params.toString()}#market`;
}

export default function NotificationCenter({ deals }: { deals: Deal[] }) {
  const discounted = useMemo(
    () => deals.filter((deal) => deal.old_price && deal.old_price > deal.price),
    [deals],
  );
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<number[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(value)) setSeen(value);
    } catch {}
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function mark(id: number) {
    setSeen((current) => {
      const next = current.includes(id) ? current : [...current, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  function openDeal(deal: Deal) {
    mark(deal.id);
    setOpen(false);
    window.location.href = dealUrl(deal);
  }

  const unread = discounted.filter((item) => !seen.includes(item.id)).length;

  return (
    <div ref={root} className="haswolf-notification-root">
      <button
        type="button"
        className="haswolf-notification-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span aria-hidden="true">🔔</span>
        <span>Bildirimler</span>
        {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
      </button>

      {open && (
        <aside className="haswolf-notification-panel">
          <header>
            <div><small>HASWOLF</small><h2>Bildirim Merkezi</h2></div>
            <button type="button" onClick={() => setOpen(false)}>×</button>
          </header>
          <div className="haswolf-notification-list">
            {discounted.length ? discounted.map((deal) => {
              const unit = deal.category === "dc" ? "M" : "TL";
              const percent = Math.round(((deal.old_price! - deal.price) / deal.old_price!) * 100);
              return (
                <button
                  key={deal.id}
                  type="button"
                  className={!seen.includes(deal.id) ? "is-unread" : ""}
                  onClick={() => openDeal(deal)}
                >
                  <span className="haswolf-notification-icon">🔥</span>
                  <span>
                    <strong>{deal.name}</strong>
                    <small>{deal.server} · %{percent} indirim</small>
                    <span className="haswolf-notification-price">
                      <del>{deal.old_price!.toLocaleString("tr-TR")} {unit}</del>
                      <b>{deal.price.toLocaleString("tr-TR")} {unit}</b>
                    </span>
                  </span>
                  <i>›</i>
                </button>
              );
            }) : <p className="haswolf-notification-empty">Yeni bildirimin bulunmuyor.</p>}
          </div>
        </aside>
      )}
    </div>
  );
}
