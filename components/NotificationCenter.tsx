"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";

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

type Announcement = {
  id: string | number;
  title: string;
  body: string | null;
  link: string | null;
  image_url: string | null;
  is_pinned: boolean | null;
  created_at: string | null;
};

const KEY = "haswolf_seen_notifications_v5";
const COMMUNITY_URL = "https://chat.whatsapp.com/K4Porjlqi5GLlsowoTG4WQ";

function liveTime(value:string|undefined|null,now:number){const date=new Date(value||now);const diff=Math.max(0,now-date.getTime());const min=Math.floor(diff/60000);if(min<1)return "Şimdi";if(min<60)return `${min} dakika önce`;const hour=Math.floor(min/60);if(hour<24)return `${hour} saat önce`;return `${date.toLocaleDateString("tr-TR")} · ${date.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}`;}

function dealUrl(deal: Deal) {
  const params = new URLSearchParams({ market: deal.category, server: deal.server, product: String(deal.id) });
  return `/?${params.toString()}#market`;
}

export default function NotificationCenter({ deals }: { deals: Deal[] }) {
  const discounted = useMemo(
    () => deals.filter((deal) => Boolean(deal.old_price && deal.old_price > deal.price) || deal.is_daily_favorite || deal.is_best_price || deal.low_stock_alert),
    [deals],
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [socialTarget, setSocialTarget] = useState<Element | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setSocialTarget(document.querySelector(".haswolf-social-strip"));
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(value)) setSeen(value.map(String));
    } catch {}
  }, []);

  useEffect(() => {
    let active = true;
    async function loadAnnouncements() {
      const { data } = await supabase
        .from("site_notifications")
        .select("id,title,body,link,image_url,is_pinned,created_at")
        .eq("is_active", true)
        .eq("notification_type", "announcement")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);
      if (active) setAnnouncements((data || []) as Announcement[]);
    }
    void loadAnnouncements();
    const channel = supabase
      .channel("public-site-announcements")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_notifications" }, () => void loadAnnouncements())
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { const timer=window.setInterval(()=>setNow(Date.now()),30000); return()=>window.clearInterval(timer); },[]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open]);

  function mark(key: string) {
    setSeen((current) => {
      const next = current.includes(key) ? current : [...current, key];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  function openDeal(deal: Deal) {
    mark(`deal:${deal.id}`);
    setOpen(false);
    window.location.href = dealUrl(deal);
  }

  function openAnnouncement(item: Announcement) {
    mark(`announcement:${item.id}`);
    if (item.link) window.open(item.link, "_blank", "noopener,noreferrer");
  }

  const unreadDeals = discounted.filter((item) => !seen.includes(`deal:${item.id}`)).length;
  const unreadAnnouncements = announcements.filter((item) => !seen.includes(`announcement:${item.id}`)).length;
  const unread = unreadDeals + unreadAnnouncements;

  return (
    <div ref={root} className="haswolf-notification-root">
      {mounted && socialTarget && createPortal(
        <a
          href={COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="haswolf-community-join"
          aria-label="HASWOLF WhatsApp topluluğuna katıl"
        >
          <span className="haswolf-community-join__icon">☎</span>
          <span className="haswolf-community-join__copy"><strong>WhatsApp</strong><small>Topluluğumuza Katıl</small></span>
        </a>,
        socialTarget,
      )}

      <button type="button" className="haswolf-notification-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span aria-hidden="true">🔔</span>
        <span>Bildirimler</span>
        {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
      </button>

      {mounted && open && createPortal(
        <div className="haswolf-modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <aside className="haswolf-notification-panel haswolf-modal-card" role="dialog" aria-modal="true" aria-labelledby="notification-title">
            <header>
              <div><small>HASWOLF LIVE</small><h2 id="notification-title">Duyuru & Bildirim Merkezi</h2></div>
              <button type="button" className="haswolf-panel-close" onClick={() => setOpen(false)} aria-label="Bildirim merkezini kapat">✕</button>
            </header>

            <a className="haswolf-notification-community-card" href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
              <span className="haswolf-notification-community-icon">☎</span>
              <span><strong>WhatsApp Topluluğumuza Katıl</strong><small>Duyuruları, kampanyaları ve HASWOLF gelişmelerini takip et.</small></span>
              <i>Katıl →</i>
            </a>

            <div className="haswolf-notification-list">
              {announcements.map((item) => (
                <article key={`announcement-${item.id}`} className={`haswolf-announcement-item ${!seen.includes(`announcement:${item.id}`) ? "is-unread" : ""}`}>
                  {item.image_url && <img src={item.image_url} alt="" loading="lazy" />}
                  <div>
                    <span className="haswolf-announcement-kicker">{item.is_pinned ? "📌 SABİT DUYURU" : "📣 DUYURU"}</span>
                    <strong>{item.title}</strong>
                    {item.body && <p>{item.body}</p>}
                    <footer>
                      <time>{liveTime(item.created_at, now)}</time>
                      <button type="button" onClick={() => openAnnouncement(item)}>{item.link ? "Detayı Aç" : "Okundu"}</button>
                    </footer>
                  </div>
                </article>
              ))}

              {discounted.map((deal) => {
                const unit = deal.category === "dc" ? "M" : "TL";
                const percent = deal.old_price ? Math.round(((deal.old_price - deal.price) / deal.old_price) * 100) : 0;
                return (
                  <button key={`deal-${deal.id}`} type="button" className={!seen.includes(`deal:${deal.id}`) ? "is-unread" : ""} onClick={() => openDeal(deal)}>
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
                      <time>{liveTime(deal.created_at,now)}</time>
                    </span>
                    <i>›</i>
                  </button>
                );
              })}
              {!announcements.length && !discounted.length && <p className="haswolf-notification-empty">Yeni duyuru veya bildirimin bulunmuyor.</p>}
            </div>
          </aside>
        </div>, document.body)}

      <style jsx global>{`
        .haswolf-community-join{display:inline-grid;grid-template-columns:34px auto;align-items:center;gap:8px;min-height:48px;padding:7px 11px;border:1px solid rgba(37,211,102,.34);border-radius:12px;background:linear-gradient(145deg,rgba(22,92,48,.24),rgba(8,13,10,.84));color:#eafff0;text-decoration:none;box-shadow:inset 0 1px rgba(255,255,255,.06),0 8px 22px rgba(0,0,0,.22);white-space:nowrap}.haswolf-community-join__icon{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:linear-gradient(145deg,#2ee76f,#159847);color:#06150a;font-size:15px;font-weight:900;box-shadow:0 0 14px rgba(37,211,102,.18)}.haswolf-community-join__copy{display:flex;flex-direction:column;line-height:1.05}.haswolf-community-join__copy strong{font-size:12px;color:#fff}.haswolf-community-join__copy small{margin-top:3px;font-size:9px;color:#91dca9}.haswolf-community-join:hover{transform:translateY(-1px);border-color:rgba(37,211,102,.7);background:linear-gradient(145deg,rgba(30,129,65,.32),rgba(8,16,11,.88))}
        .haswolf-notification-community-card{margin:12px 14px;display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:10px;padding:12px;border:1px solid rgba(37,211,102,.28);border-radius:13px;background:linear-gradient(135deg,rgba(37,211,102,.12),rgba(5,13,9,.55));color:#fff;text-decoration:none}.haswolf-notification-community-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#25d366;color:#07150b;font-weight:900}.haswolf-notification-community-card small{display:block;margin-top:3px;color:#96a19a;font-size:11px}.haswolf-notification-community-card i{color:#59e98e;font-style:normal;font-size:12px;font-weight:800}
        .haswolf-announcement-item{display:grid;grid-template-columns:auto 1fr;gap:12px;padding:14px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.015)}.haswolf-announcement-item.is-unread{background:linear-gradient(90deg,rgba(217,170,74,.10),transparent)}.haswolf-announcement-item img{width:84px;height:68px;object-fit:cover;border-radius:9px;border:1px solid rgba(217,170,74,.25)}.haswolf-announcement-item strong{display:block;margin-top:3px;color:#fff;font-size:14px}.haswolf-announcement-item p{margin:6px 0 0;color:#aeb4b5;font-size:12px;line-height:1.55}.haswolf-announcement-kicker{color:#e4b753;font-size:9px;font-weight:900;letter-spacing:.11em}.haswolf-announcement-item footer{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:9px}.haswolf-announcement-item time{color:#697174;font-size:10px}.haswolf-announcement-item footer button{border:1px solid rgba(217,170,74,.30);border-radius:7px;background:rgba(217,170,74,.08);color:#ecc666;padding:6px 9px;font-size:10px;font-weight:800}
        @media(max-width:900px){.haswolf-community-join{display:none}.haswolf-announcement-item{grid-template-columns:1fr}.haswolf-announcement-item img{width:100%;height:120px}}
      `}</style>
    </div>
  );
}
