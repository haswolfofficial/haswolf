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

const STORAGE_KEY = "haswolf_seen_discount_ids_v2";

export default function NotificationCenter({ deals }: { deals: Deal[] }) {
  const eligible = useMemo(
    () => deals.filter((deal) => deal.old_price && deal.old_price > deal.price),
    [deals],
  );
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(parsed)) setSeenIds(parsed.filter(Number.isFinite));
    } catch {}
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!eligible.length) return;
    const unseenIndex = eligible.findIndex((deal) => !seenIds.includes(deal.id));
    if (unseenIndex < 0) return;
    setActiveIndex(unseenIndex);
    const showTimer = window.setTimeout(() => setToastVisible(true), 1800);
    const hideTimer = window.setTimeout(() => {
      setToastVisible(false);
      markSeen(eligible[unseenIndex].id);
    }, 9500);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [eligible, seenIds]);

  function markSeen(id: number) {
    setSeenIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function closeToast() {
    const deal = eligible[activeIndex];
    if (deal) markSeen(deal.id);
    setToastVisible(false);
  }

  const unreadCount = eligible.filter((deal) => !seenIds.includes(deal.id)).length;
  const activeDeal = eligible[activeIndex];

  return (
    <>
      <div ref={rootRef} className="haswolf-notification-root">
        <button
          type="button"
          className="haswolf-notification-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="haswolf-notification-panel"
        >
          <span aria-hidden="true">ğŸ””</span>
          <span>Bildirimler</span>
          {unreadCount > 0 && <b>{unreadCount > 9 ? "9+" : unreadCount}</b>}
        </button>

        {open && (
          <aside id="haswolf-notification-panel" className="haswolf-notification-panel">
            <header>
              <div>
                <small>HASWOLF</small>
                <h2>Bildirim Merkezi</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Kapat">×</button>
            </header>

            <div className="haswolf-notification-list">
              {eligible.length ? (
                eligible.map((deal) => {
                  const unit = deal.category === "dc" ? "M" : "TL";
                  const pct = Math.round(((deal.old_price! - deal.price) / deal.old_price!) * 100);
                  const unread = !seenIds.includes(deal.id);
                  return (
                    <button
                      key={deal.id}
                      type="button"
                      className={unread ? "is-unread" : ""}
                      onClick={() => markSeen(deal.id)}
                    >
                      <span>ğŸ”¥</span>
                      <span>
                        <strong>{deal.name}</strong>
                        <small>{deal.server} · %{pct} indirim</small>
                        <span>
                          <del>{deal.old_price!.toLocaleString("tr-TR")} {unit}</del>
                          <b>{deal.price.toLocaleString("tr-TR")} {unit}</b>
                        </span>
                      </span>
                      {unread && <i />}
                    </button>
                  );
                })
              ) : (
                <div className="haswolf-notification-empty">Yeni bildirim bulunmuyor.</div>
              )}
            </div>
          </aside>
        )}
      </div>

      {activeDeal && (
        <aside className={`haswolf-sale-toast ${toastVisible ? "is-visible" : ""}`} aria-live="polite">
          <button onClick={closeToast} aria-label="Bildirimi kapat">×</button>
          <span className="haswolf-sale-toast__eyebrow">YENÄ° Ä°NDÄ°RÄ°M ğŸ”¥</span>
          <strong>{activeDeal.name}</strong>
          <small>{activeDeal.server}</small>
          <div>
            <del>{activeDeal.old_price!.toLocaleString("tr-TR")} {activeDeal.category === "dc" ? "M" : "TL"}</del>
            <b>{activeDeal.price.toLocaleString("tr-TR")} {activeDeal.category === "dc" ? "M" : "TL"}</b>
          </div>
          <p>Kapatınca Bildirimler alanında kalır.</p>
        </aside>
      )}
    </>
  );
}