"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Row = { id: number; server: "EPHESUS" | "PERGAMON" | "TEOS"; price: number; old_price: number | null };

const SERVER_LABELS: Record<Row["server"], string> = { EPHESUS: "Ephesus", PERGAMON: "Pergamon", TEOS: "Teos" };

function formatTl(value: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

export default function YangMarketIndex() {
  const pathname = usePathname();
  const [rows, setRows] = useState<Row[]>([]);
  const [pulse, setPulse] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);

  useEffect(() => {
    if (pathname !== "/") return;
    setIntroOpen(true);
    const timer = window.setTimeout(() => setIntroOpen(false), 10000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    let active = true;
    async function load() {
      const { data } = await supabase.from("products").select("id,server,price,old_price").eq("category", "yang").eq("is_active", true).in("server", ["EPHESUS", "PERGAMON", "TEOS"]);
      if (!active) return;
      setRows((data ?? []) as Row[]);
      setPulse(true);
      window.setTimeout(() => setPulse(false), 650);
    }
    void load();
    const channel = supabase.channel("yang-market-index").on("postgres_changes", { event: "UPDATE", schema: "public", table: "products", filter: "category=eq.yang" }, () => void load()).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [pathname]);

  const markets = useMemo(() => (["EPHESUS", "PERGAMON", "TEOS"] as const).map((server) => {
    const row = rows.find((item) => item.server === server);
    const current = row ? Number(row.price) / 1000 : 0;
    const previous = row?.old_price ? Number(row.old_price) / 1000 : 10;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    return { server, current, previous, change };
  }), [rows]);

  if (pathname !== "/" || !rows.length) return null;

  return (
    <aside className={`haswolf-yang-terminal ${introOpen ? "is-intro-open" : ""} ${pulse ? "is-pulsing" : ""}`} aria-label="HASWOLF Yang Borsası">
      <div className="haswolf-yang-terminal__tab">
        <span className="haswolf-yang-terminal__dot" />
        <span>HASWOLF<br/>YANG BORSASI</span>
        <b>HMX</b>
      </div>
      <div className="haswolf-yang-terminal__panel">
        <div className="haswolf-yang-terminal__topbar">
          <div>
            <span className="haswolf-yang-terminal__live"><i /> CANLI PİYASA</span>
            <strong>HASWOLF YANG BORSASI</strong>
            <small>1 M referans fiyatı · son değişime göre</small>
          </div>
          <span className="haswolf-yang-terminal__stamp">HMX</span>
        </div>

        <div className="haswolf-yang-terminal__ticker" aria-hidden="true">
          <div className="haswolf-yang-terminal__ticker-track">
            {[...markets, ...markets].map((market, index) => {
              const buyerPositive = market.change <= 0;
              return <span key={`${market.server}-${index}`}><b>{SERVER_LABELS[market.server]}</b><strong>₺{formatTl(market.current)}</strong><em className={buyerPositive ? "positive" : "negative"}>{market.change < 0 ? "▼" : market.change > 0 ? "▲" : "●"} %{Math.abs(market.change).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</em></span>;
            })}
          </div>
        </div>

        <div className="haswolf-yang-terminal__grid">
          <div className="haswolf-yang-terminal__labels"><span>Sunucu</span><span>1 M</span><span>Önceki</span><span>Değişim</span></div>
          {markets.map((market) => {
            const direction = market.change > 0 ? "up" : market.change < 0 ? "down" : "flat";
            const symbol = direction === "up" ? "▲" : direction === "down" ? "▼" : "●";
            return (
              <div className={`haswolf-yang-terminal__row is-${direction}`} key={market.server}>
                <span><b>{SERVER_LABELS[market.server]}</b><small>RO/{market.server.slice(0,3)}</small></span>
                <span><b>₺{formatTl(market.current)}</b></span>
                <span><b>₺{formatTl(market.previous)}</b><small>önceki fiyat</small></span>
                <span className="haswolf-yang-terminal__change"><b>{symbol} %{Math.abs(market.change).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</b><small>{direction === "down" ? "Alıcı avantajı" : direction === "up" ? "Fiyat artışı" : "Sabit"}</small></span>
              </div>
            );
          })}
        </div>

        <div className="haswolf-yang-terminal__disclaimer">
          <b>Fiyatlar canlı piyasaya göre hesaplanır.</b>
          <span>Piyasa koşulları değişkendir. Gösterge son fiyat hareketini yansıtır; fiyatlar güncel piyasa koşullarına göre sisteme işlenir.</span>
        </div>
      </div>
      <style jsx global>{`
        .haswolf-yang-terminal{position:fixed;right:0;top:220px;z-index:46;width:446px;height:356px;pointer-events:none;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.haswolf-yang-terminal__tab{pointer-events:auto;position:absolute;right:0;top:50%;transform:translateY(-50%);width:78px;height:166px;border:1px solid #c9a64a;border-right:0;border-radius:16px 0 0 16px;background:linear-gradient(180deg,#0b1118,#121922 58%,#0a0f15);box-shadow:-10px 16px 34px rgba(0,0,0,.35),inset 0 1px rgba(255,255,255,.06);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#f4d27a;cursor:default}.haswolf-yang-terminal__tab span:not(.haswolf-yang-terminal__dot){font-size:10px;line-height:1.25;text-align:center;font-weight:800;letter-spacing:.06em}.haswolf-yang-terminal__tab b{font-size:10px;color:#fff;border:1px solid rgba(217,170,74,.45);border-radius:6px;padding:5px 6px;background:rgba(217,170,74,.08)}.haswolf-yang-terminal__dot{width:8px;height:8px;border-radius:50%;background:#28d17c;box-shadow:0 0 12px #28d17c;animation:hmxLive 1.5s infinite}.haswolf-yang-terminal__panel{pointer-events:auto;position:absolute;right:70px;top:0;width:372px;overflow:hidden;border:1px solid #26313d;border-radius:16px;background:linear-gradient(180deg,#0a1016,#0d141c 48%,#080d12);color:#e8eef5;box-shadow:0 28px 80px rgba(0,0,0,.48),0 0 0 1px rgba(255,255,255,.02) inset;opacity:0;transform:translateX(34px) scale(.97);transform-origin:right center;transition:opacity .22s ease,transform .22s ease;visibility:hidden}.haswolf-yang-terminal:hover .haswolf-yang-terminal__panel,.haswolf-yang-terminal:focus-within .haswolf-yang-terminal__panel,.haswolf-yang-terminal.is-intro-open .haswolf-yang-terminal__panel{opacity:1;transform:translateX(0) scale(1);visibility:visible}.haswolf-yang-terminal.is-pulsing .haswolf-yang-terminal__tab{animation:hmxPulse .65s ease}.haswolf-yang-terminal__topbar{display:flex;align-items:center;justify-content:space-between;padding:15px 16px 13px;border-bottom:1px solid #202a35;background:radial-gradient(circle at 82% 10%,rgba(217,170,74,.12),transparent 36%)}.haswolf-yang-terminal__topbar>div{display:grid;gap:3px}.haswolf-yang-terminal__topbar strong{font-size:15px;letter-spacing:.035em;color:#f1d47e;font-weight:800}.haswolf-yang-terminal__topbar small{font-size:10px;color:#9aa7b5}.haswolf-yang-terminal__live{display:flex;align-items:center;gap:6px;font-size:9px;font-weight:800;letter-spacing:.08em;color:#3de08b}.haswolf-yang-terminal__live i{width:6px;height:6px;border-radius:50%;background:#2bd67b;box-shadow:0 0 9px #2bd67b}.haswolf-yang-terminal__stamp{font-size:10px;font-weight:900;letter-spacing:.08em;color:#d9aa4a;border:1px solid rgba(217,170,74,.4);background:rgba(217,170,74,.06);border-radius:8px;padding:8px}.haswolf-yang-terminal__ticker{overflow:hidden;border-bottom:1px solid #1d2630;background:#070c11}.haswolf-yang-terminal__ticker-track{display:flex;width:max-content;animation:hmxTicker 18s linear infinite}.haswolf-yang-terminal__ticker-track>span{display:flex;align-items:center;gap:8px;padding:9px 16px;border-right:1px solid #1d2630;font-size:10px;white-space:nowrap}.haswolf-yang-terminal__ticker-track b{color:#c5d0db;font-weight:700}.haswolf-yang-terminal__ticker-track strong{color:#fff;font-variant-numeric:tabular-nums}.haswolf-yang-terminal__ticker-track em{font-style:normal;font-weight:800}.haswolf-yang-terminal__ticker-track em.positive{color:#38d88a}.haswolf-yang-terminal__ticker-track em.negative{color:#f1c75b}.haswolf-yang-terminal__grid{padding:8px 11px 5px}.haswolf-yang-terminal__labels,.haswolf-yang-terminal__row{display:grid;grid-template-columns:1.05fr .72fr .84fr 1fr;gap:8px;align-items:center}.haswolf-yang-terminal__labels{padding:5px 6px;color:#8190a0;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.haswolf-yang-terminal__row{padding:11px 6px;border-top:1px solid #1c2631}.haswolf-yang-terminal__row>span{display:grid;gap:3px;min-width:0}.haswolf-yang-terminal__row b{font-size:12px;color:#f3f6f9;font-weight:750;font-variant-numeric:tabular-nums}.haswolf-yang-terminal__row small{font-size:8px;color:#8593a1}.haswolf-yang-terminal__row.is-down .haswolf-yang-terminal__change b,.haswolf-yang-terminal__row.is-down .haswolf-yang-terminal__change small{color:#41db8f}.haswolf-yang-terminal__row.is-up .haswolf-yang-terminal__change b{color:#f0c75e}.haswolf-yang-terminal__row.is-flat .haswolf-yang-terminal__change b{color:#aab5c0}.haswolf-yang-terminal__disclaimer{display:grid;gap:4px;margin:5px 11px 11px;padding:10px 11px;border:1px solid #26313c;border-radius:9px;background:#0b1219}.haswolf-yang-terminal__disclaimer b{font-size:10px;color:#e9c86d}.haswolf-yang-terminal__disclaimer span{font-size:9px;line-height:1.5;color:#9ba7b4}@keyframes hmxTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}@keyframes hmxLive{0%,100%{opacity:.45}50%{opacity:1}}@keyframes hmxPulse{0%{box-shadow:-10px 16px 34px rgba(0,0,0,.35)}50%{box-shadow:-10px 16px 34px rgba(0,0,0,.35),0 0 0 4px rgba(217,170,74,.16)}100%{box-shadow:-10px 16px 34px rgba(0,0,0,.35)}}@media(max-width:900px){.haswolf-yang-terminal{top:auto;bottom:112px;width:385px;height:318px}.haswolf-yang-terminal__panel{width:310px}.haswolf-yang-terminal__labels,.haswolf-yang-terminal__row{grid-template-columns:1fr .72fr .9fr}.haswolf-yang-terminal__labels span:nth-child(3),.haswolf-yang-terminal__row>span:nth-child(3){display:none}}@media(max-width:560px){.haswolf-yang-terminal{width:340px;bottom:100px}.haswolf-yang-terminal__panel{width:276px}.haswolf-yang-terminal__tab{width:64px;height:146px}.haswolf-yang-terminal__panel{right:58px}.haswolf-yang-terminal__ticker-track>span{padding:8px 12px}}
      `}</style>
    </aside>
  );
}
