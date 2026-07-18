"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Deal = {
  id: number;
  name: string;
  price: number;
  old_price: number | null;
  server: string;
  category: "item" | "yang" | "dc" | "account";
  created_at?: string;
  stock?: number;
  is_daily_favorite?: boolean;
  is_best_price?: boolean;
  low_stock_alert?: boolean;
};

const KEY = "haswolf_seen_discount_ids_v3";

function liveTime(value:string|undefined,now:number){const date=new Date(value||now);const diff=Math.max(0,now-date.getTime());const min=Math.floor(diff/60000);if(min<1)return "Şimdi";if(min<60)return `${min} dakika önce`;const hour=Math.floor(min/60);if(hour<24)return `${hour} saat önce`;return `${date.toLocaleDateString("tr-TR")} · ${date.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}`;}

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
    () => deals.filter((deal) =>
      Boolean(deal.old_price && deal.old_price > deal.price) ||
      deal.is_daily_favorite || deal.is_best_price || deal.low_stock_alert
    ),
    [deals],
  );
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<number[]>([]);
  const [now, setNow] = useState(Date.now());
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(value)) setSeen(value);
    } catch {}
  }, []);

  useEffect(() => { const timer=window.setInterval(()=>setNow(Date.now()),30000); return()=>window.clearInterval(timer); },[]);

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

  useEffect(() => {
    if (!discounted.length) return;
    const newest=discounted[0];
    if(seen.includes(newest.id))return;
    try{
      const context=new AudioContext();
      const osc=context.createOscillator();const gain=context.createGain();
      osc.frequency.value=880;gain.gain.value=.035;osc.connect(gain);gain.connect(context.destination);
      osc.start();osc.stop(context.currentTime+.12);
    }catch{}
  },[discounted,seen]);

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
                    <small>{deal.server} · {deal.category.toUpperCase()}</small>
                    <span className="haswolf-notification-price">
                      {deal.old_price && deal.old_price > deal.price && <del>{deal.old_price.toLocaleString("tr-TR")} {unit}</del>}
                      <b>{deal.price.toLocaleString("tr-TR")} {unit}</b>
                    </span>
                    <span className="haswolf-notification-tags">
                      {percent>0&&<em>%{percent} indirim</em>}
                      {deal.is_daily_favorite&&<em>Bugünün Favorisi</em>}
                      {deal.is_best_price&&<em>En Uygun Fiyat</em>}
                      {deal.low_stock_alert&&<em>Stok Azalıyor · {deal.stock ?? "Az"}</em>}
                    </span>
                    <time title={new Date(deal.created_at || now).toLocaleString("tr-TR")}>{liveTime(deal.created_at,now)}</time>
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
