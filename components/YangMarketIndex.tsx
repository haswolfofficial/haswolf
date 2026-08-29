"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Row = { id: number; server: "EPHESUS" | "PERGAMON" | "TEOS"; price: number; old_price: number | null };

const SERVER_LABELS: Record<Row["server"], string> = { EPHESUS: "Ephesus", PERGAMON: "Pergamon", TEOS: "Teos" };

function formatTl(value: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(value);
}

export default function YangMarketIndex() {
  const pathname = usePathname();
  const [rows, setRows] = useState<Row[]>([]);
  const [pulse, setPulse] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [manualClosed, setManualClosed] = useState(false);
  const [usdTry, setUsdTry] = useState<number | null>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    setIntroOpen(true);
    setManualClosed(false);
    const timer = window.setTimeout(() => setIntroOpen(false), 10000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    let cancelled = false;
    fetch("https://api.frankfurter.app/latest?from=USD&to=TRY", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("fx")))
      .then((payload) => {
        const rate = Number(payload?.rates?.TRY);
        if (!cancelled && Number.isFinite(rate) && rate > 0) setUsdTry(rate);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
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

  const forceOpen = introOpen && !manualClosed;

  return (
    <aside className={`haswolf-yang-terminal ${forceOpen ? "is-intro-open" : ""} ${pulse ? "is-pulsing" : ""}`} aria-label="HASWOLF Yang Borsası">
      <div className="haswolf-yang-terminal__tab">
        <span className="haswolf-yang-terminal__dot" />
        <span>HASWOLF<br/>YANG BORSASI</span>
        <b>HMX</b>
      </div>
      <div className="haswolf-yang-terminal__panel">
        <div className="haswolf-yang-terminal__topbar">
          <div>
            <button type="button" className="haswolf-yang-terminal__live" onClick={() => { setManualClosed(true); setIntroOpen(false); }} aria-label="Canlı piyasa panelini kapat"><i /> CANLI PİYASA <span>×</span></button>
            <strong>HASWOLF YANG BORSASI</strong>
            <small>Canlı fiyat akışı · son değişime göre</small>
          </div>
          <span className="haswolf-yang-terminal__stamp">HMX</span>
        </div>

        <div className="haswolf-yang-terminal__ticker" aria-label="Canlı Yang fiyat akışı">
          <div className="haswolf-yang-terminal__ticker-track">
            {[...markets, ...markets].map((market, index) => {
              const buyerPositive = market.change <= 0;
              return <span key={`${market.server}-${index}`}><b>{SERVER_LABELS[market.server]}</b><strong>{formatTl(market.current)} TL</strong>{usdTry && <small>≈ ${formatUsd(market.current / usdTry)}</small>}<em className={buyerPositive ? "positive" : "negative"}>{market.change < 0 ? "▼" : market.change > 0 ? "▲" : "●"} %{Math.abs(market.change).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</em></span>;
            })}
          </div>
        </div>

        <div className="haswolf-yang-terminal__grid">
          <div className="haswolf-yang-terminal__labels"><span>Sunucu</span><span>Güncel Fiyat</span><span>Önceki</span><span>Değişim</span></div>
          {markets.map((market) => {
            const direction = market.change > 0 ? "up" : market.change < 0 ? "down" : "flat";
            const symbol = direction === "up" ? "▲" : direction === "down" ? "▼" : "●";
            return (
              <div className={`haswolf-yang-terminal__row is-${direction}`} key={market.server}>
                <span><b>{SERVER_LABELS[market.server]}</b><small>RO/{market.server.slice(0,3)}</small></span>
                <span className="haswolf-yang-terminal__current"><b>{formatTl(market.current)} TL</b>{usdTry && <small>≈ ${formatUsd(market.current / usdTry)}</small>}</span>
                <span><b>{formatTl(market.previous)} TL</b><small>önceki fiyat</small></span>
                <span className="haswolf-yang-terminal__change"><b>{symbol} %{Math.abs(market.change).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</b><small>{direction === "down" ? "Alıcı avantajı" : direction === "up" ? "Fiyat artışı" : "Sabit"}</small></span>
              </div>
            );
          })}
        </div>

        <div className="haswolf-yang-terminal__disclaimer">
          <span className="haswolf-yang-terminal__disclaimer-icon">i</span>
          <div><b>Fiyatlar canlı piyasaya göre hesaplanır.</b><span>Piyasa koşulları değişkendir. Gösterge son fiyat hareketini yansıtır; fiyatlar güncel piyasa koşullarına göre sisteme işlenir.</span>{usdTry && <small>Gösterilen USD karşılıkları yaklaşık değerdir · 1 USD ≈ {formatTl(usdTry)} TL</small>}</div>
        </div>
      </div>
      <style jsx global>{`
        .haswolf-yang-terminal{position:fixed;right:0;top:220px;z-index:46;width:462px;height:372px;pointer-events:none;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.haswolf-yang-terminal__tab{pointer-events:auto;position:absolute;right:0;top:50%;transform:translateY(-50%);width:78px;height:166px;border:1px solid #c9a64a;border-right:0;border-radius:16px 0 0 16px;background:linear-gradient(180deg,#0b1118,#121922 58%,#0a0f15);box-shadow:-10px 16px 34px rgba(0,0,0,.35),inset 0 1px rgba(255,255,255,.06);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#f4d27a}.haswolf-yang-terminal__tab span:not(.haswolf-yang-terminal__dot){font-size:10px;line-height:1.25;text-align:center;font-weight:800;letter-spacing:.06em}.haswolf-yang-terminal__tab b{font-size:10px;color:#fff;border:1px solid rgba(217,170,74,.45);border-radius:6px;padding:5px 6px;background:rgba(217,170,74,.08)}.haswolf-yang-terminal__dot{width:8px;height:8px;border-radius:50%;background:#28d17c;box-shadow:0 0 12px #28d17c;animation:hmxLive 1.5s infinite}.haswolf-yang-terminal__panel{pointer-events:auto;position:absolute;right:70px;top:0;width:388px;overflow:hidden;border:1px solid #293746;border-radius:16px;background:linear-gradient(180deg,#091017,#0c141d 48%,#080d12);color:#e8eef5;box-shadow:0 28px 80px rgba(0,0,0,.48),0 0 0 1px rgba(255,255,255,.02) inset;opacity:0;transform:translateX(34px) scale(.97);transform-origin:right center;transition:opacity .22s ease,transform .22s ease;visibility:hidden}.haswolf-yang-terminal:hover .haswolf-yang-terminal__panel,.haswolf-yang-terminal:focus-within .haswolf-yang-terminal__panel,.haswolf-yang-terminal.is-intro-open .haswolf-yang-terminal__panel{opacity:1;transform:translateX(0) scale(1);visibility:visible}.haswolf-yang-terminal__topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 15px 12px;border-bottom:1px solid #293746;background:linear-gradient(100deg,rgba(245,158,11,.18),rgba(217,119,6,.06) 62%,transparent)}.haswolf-yang-terminal__topbar>div{display:grid;gap:5px}.haswolf-yang-terminal__topbar strong{display:inline-block;width:max-content;padding:6px 10px;border:1px solid rgba(255,188,61,.7);border-radius:8px;background:linear-gradient(90deg,#f59e0b,#e17f08);box-shadow:0 6px 22px rgba(245,158,11,.26),inset 0 1px rgba(255,255,255,.28);font-size:15px;letter-spacing:.04em;color:#160d02;font-weight:950}.haswolf-yang-terminal__topbar small{font-size:10px;color:#b6c0ca}.haswolf-yang-terminal__live{display:flex;align-items:center;gap:6px;width:max-content;border:0;background:transparent;padding:0;color:#3de08b;font-size:9px;font-weight:800;letter-spacing:.08em;cursor:pointer}.haswolf-yang-terminal__live span{color:#9fb0bf;font-size:13px}.haswolf-yang-terminal__live i{width:6px;height:6px;border-radius:50%;background:#2bd67b;box-shadow:0 0 9px #2bd67b}.haswolf-yang-terminal__stamp{font-size:10px;font-weight:900;color:#d9aa4a;border:1px solid rgba(217,170,74,.4);background:rgba(217,170,74,.06);border-radius:8px;padding:8px}.haswolf-yang-terminal__ticker{overflow:hidden;border-bottom:1px solid #293746;background:#060b10}.haswolf-yang-terminal__ticker-track{display:flex;width:max-content;min-width:max-content;will-change:transform;animation:hmxTicker 14s linear infinite!important;transform:translate3d(0,0,0)}.haswolf-yang-terminal__ticker-track>span{display:flex;align-items:center;gap:8px;padding:9px 16px;border-right:1px solid #26313d;font-size:10px;white-space:nowrap}.haswolf-yang-terminal__ticker-track b{color:#d4dde5}.haswolf-yang-terminal__ticker-track strong{color:#fff}.haswolf-yang-terminal__ticker-track small{color:#8aa0b2;font-size:8px}.haswolf-yang-terminal__ticker-track em{font-style:normal;font-weight:800}.haswolf-yang-terminal__ticker-track em.positive{color:#38d88a}.haswolf-yang-terminal__ticker-track em.negative{color:#f1c75b}.haswolf-yang-terminal__grid{margin:10px;border:1px solid #2a3948;border-radius:10px;overflow:hidden;background:#0a1118}.haswolf-yang-terminal__labels,.haswolf-yang-terminal__row{display:grid;grid-template-columns:1.02fr 1fr .88fr 1fr;align-items:stretch}.haswolf-yang-terminal__labels{background:#0d1720;color:#91a0ae;font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.haswolf-yang-terminal__labels span,.haswolf-yang-terminal__row>span{padding:8px 7px;border-right:1px solid #263543;min-width:0}.haswolf-yang-terminal__labels span:last-child,.haswolf-yang-terminal__row>span:last-child{border-right:0}.haswolf-yang-terminal__row{border-top:1px solid #263543}.haswolf-yang-terminal__row>span{display:grid;align-content:center;gap:3px}.haswolf-yang-terminal__row b{font-size:11px;color:#f3f6f9;font-weight:760;font-variant-numeric:tabular-nums}.haswolf-yang-terminal__row small{font-size:8px;color:#8795a3}.haswolf-yang-terminal__current{background:linear-gradient(135deg,rgba(245,158,11,.28),rgba(217,119,6,.09));box-shadow:inset 0 0 20px rgba(245,158,11,.05)}.haswolf-yang-terminal__current b{color:#ffd27a;font-size:12px}.haswolf-yang-terminal__current small{color:#d8ad5d}.haswolf-yang-terminal__row.is-down .haswolf-yang-terminal__change b,.haswolf-yang-terminal__row.is-down .haswolf-yang-terminal__change small{color:#41db8f}.haswolf-yang-terminal__row.is-up .haswolf-yang-terminal__change b{color:#f0c75e}.haswolf-yang-terminal__row.is-flat .haswolf-yang-terminal__change b{color:#aab5c0}.haswolf-yang-terminal__disclaimer{display:flex;gap:10px;margin:0 10px 10px;padding:11px;border:1px solid rgba(245,158,11,.48);border-radius:10px;background:linear-gradient(135deg,rgba(245,158,11,.14),rgba(15,23,32,.96));box-shadow:inset 0 0 24px rgba(245,158,11,.04)}.haswolf-yang-terminal__disclaimer-icon{flex:0 0 22px;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#f59e0b;color:#140d04;font-size:12px;font-weight:950}.haswolf-yang-terminal__disclaimer>div{display:grid;gap:4px}.haswolf-yang-terminal__disclaimer b{font-size:10px;color:#ffd477}.haswolf-yang-terminal__disclaimer span{font-size:8.5px;line-height:1.45;color:#aeb8c2}.haswolf-yang-terminal__disclaimer small{font-size:8px;color:#d7b766}@keyframes hmxTicker{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-50%,0,0)}}@keyframes hmxLive{0%,100%{opacity:.45}50%{opacity:1}}@media(max-width:900px){.haswolf-yang-terminal{top:auto;bottom:112px;width:400px;height:330px}.haswolf-yang-terminal__panel{width:325px}.haswolf-yang-terminal__labels,.haswolf-yang-terminal__row{grid-template-columns:1fr 1fr .95fr}.haswolf-yang-terminal__labels span:nth-child(3),.haswolf-yang-terminal__row>span:nth-child(3){display:none}}@media(max-width:560px){.haswolf-yang-terminal{width:350px;bottom:100px}.haswolf-yang-terminal__panel{width:286px}.haswolf-yang-terminal__tab{width:64px;height:146px}.haswolf-yang-terminal__panel{right:58px}.haswolf-yang-terminal__ticker-track>span{padding:8px 12px}.haswolf-yang-terminal__labels span,.haswolf-yang-terminal__row>span{padding:7px 5px}}
      `}</style>
    </aside>
  );
}
