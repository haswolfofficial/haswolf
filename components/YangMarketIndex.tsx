"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Row = {
  id: number;
  server: "EPHESUS" | "PERGAMON" | "TEOS";
  price: number;
  old_price: number | null;
};

const SERVER_LABELS: Record<Row["server"], string> = {
  EPHESUS: "Ephesus",
  PERGAMON: "Pergamon",
  TEOS: "Teos",
};

function formatTl(value: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

export default function YangMarketIndex() {
  const pathname = usePathname();
  const [rows, setRows] = useState<Row[]>([]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("products")
        .select("id,server,price,old_price")
        .eq("category", "yang")
        .eq("is_active", true)
        .in("server", ["EPHESUS", "PERGAMON", "TEOS"]);
      if (!active) return;
      setRows((data ?? []) as Row[]);
      setPulse(true);
      window.setTimeout(() => setPulse(false), 650);
    }

    void load();
    const channel = supabase
      .channel("yang-market-index")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products", filter: "category=eq.yang" }, () => void load())
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [pathname]);

  const markets = useMemo(() => {
    return (["EPHESUS", "PERGAMON", "TEOS"] as const).map((server) => {
      const row = rows.find((item) => item.server === server);
      const current = row ? Number(row.price) / 1000 : 0;
      const previous = row?.old_price ? Number(row.old_price) / 1000 : 10;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      return { server, current, previous, change };
    });
  }, [rows]);

  if (pathname !== "/" || !rows.length) return null;

  return (
    <aside className={`haswolf-yang-index ${pulse ? "is-pulsing" : ""}`} aria-label="HASWOLF Yang Endeksi">
      <div className="haswolf-yang-index__head">
        <div>
          <span className="haswolf-yang-index__live"><i /> CANLI</span>
          <strong>HASWOLF YANG ENDEKSİ</strong>
          <small>1 M piyasa fiyatı · son değişim</small>
        </div>
        <span className="haswolf-yang-index__badge">HMX</span>
      </div>
      <div className="haswolf-yang-index__table">
        <div className="haswolf-yang-index__row haswolf-yang-index__labels"><span>Sunucu</span><span>Yang</span><span>Değişim</span></div>
        {markets.map((market) => {
          const direction = market.change > 0 ? "up" : market.change < 0 ? "down" : "flat";
          const symbol = direction === "up" ? "▲" : direction === "down" ? "▼" : "●";
          return (
            <div className={`haswolf-yang-index__row is-${direction}`} key={market.server}>
              <span><b>{SERVER_LABELS[market.server]}</b><small>RO/{market.server.slice(0, 3)}</small></span>
              <span><b>₺{formatTl(market.current)}</b><small>Önceki ₺{formatTl(market.previous)}</small></span>
              <span className="haswolf-yang-index__change"><b>{symbol} %{Math.abs(market.change).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</b><small>{direction === "up" ? "Yükseliş" : direction === "down" ? "Düşüş" : "Sabit"}</small></span>
            </div>
          );
        })}
      </div>
      <div className="haswolf-yang-index__ticker"><span>● HASWOLF MARKET</span><div>Fiyatlar yönetici panelindeki son güncellemeye göre canlı hesaplanır.</div></div>
      <style jsx global>{`
        .haswolf-yang-index{position:fixed;right:18px;top:245px;z-index:44;width:min(390px,calc(100vw - 28px));overflow:hidden;border:1px solid rgba(217,170,74,.38);border-radius:16px;background:linear-gradient(145deg,rgba(7,10,10,.97),rgba(9,9,7,.96));box-shadow:0 24px 70px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.025) inset;backdrop-filter:blur(18px);transition:box-shadow .3s ease,transform .3s ease}.haswolf-yang-index:hover{transform:translateY(-2px);box-shadow:0 28px 78px rgba(0,0,0,.64),0 0 28px rgba(217,170,74,.08)}.haswolf-yang-index.is-pulsing{animation:haswolfIndexPulse .65s ease}.haswolf-yang-index__head{display:flex;align-items:center;justify-content:space-between;padding:15px 16px 13px;border-bottom:1px solid rgba(255,255,255,.07);background:radial-gradient(circle at 88% 15%,rgba(217,170,74,.13),transparent 42%)}.haswolf-yang-index__head>div{display:grid;gap:2px}.haswolf-yang-index__head strong{font-size:13px;letter-spacing:.11em;color:#f0c65c}.haswolf-yang-index__head small{font-size:10px;color:#71717a}.haswolf-yang-index__live{display:flex;align-items:center;gap:5px;font-size:9px;font-weight:900;letter-spacing:.13em;color:#4ade80}.haswolf-yang-index__live i{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e;animation:haswolfLive 1.6s infinite}.haswolf-yang-index__badge{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(217,170,74,.32);border-radius:10px;background:rgba(217,170,74,.06);font-size:10px;font-weight:900;letter-spacing:.08em;color:#d9aa4a}.haswolf-yang-index__table{padding:8px 10px}.haswolf-yang-index__row{display:grid;grid-template-columns:1.05fr 1fr .9fr;align-items:center;gap:8px;padding:10px 7px;border-bottom:1px solid rgba(255,255,255,.055)}.haswolf-yang-index__row:last-child{border-bottom:0}.haswolf-yang-index__row>span{display:grid;gap:2px;min-width:0}.haswolf-yang-index__row b{font-size:12px;color:#e4e4e7}.haswolf-yang-index__row small{font-size:8px;color:#666b72;white-space:nowrap}.haswolf-yang-index__labels{padding-top:4px;padding-bottom:5px}.haswolf-yang-index__labels span{font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#62666d}.haswolf-yang-index__change b{font-variant-numeric:tabular-nums}.haswolf-yang-index__row.is-up .haswolf-yang-index__change b{color:#4ade80;text-shadow:0 0 12px rgba(74,222,128,.16)}.haswolf-yang-index__row.is-down .haswolf-yang-index__change b{color:#fb7185;text-shadow:0 0 12px rgba(251,113,133,.14)}.haswolf-yang-index__row.is-flat .haswolf-yang-index__change b{color:#a1a1aa}.haswolf-yang-index__ticker{display:flex;gap:9px;align-items:center;overflow:hidden;border-top:1px solid rgba(217,170,74,.16);background:#070807;padding:8px 12px;font-size:8px;color:#666}.haswolf-yang-index__ticker>span{flex:none;color:#d9aa4a;font-weight:900;letter-spacing:.08em}.haswolf-yang-index__ticker>div{white-space:nowrap;animation:haswolfTicker 11s linear infinite}@keyframes haswolfLive{0%,100%{opacity:.45}50%{opacity:1}}@keyframes haswolfTicker{from{transform:translateX(28px)}to{transform:translateX(-230px)}}@keyframes haswolfIndexPulse{0%{box-shadow:0 24px 70px rgba(0,0,0,.58)}45%{box-shadow:0 24px 70px rgba(0,0,0,.58),0 0 30px rgba(217,170,74,.28)}100%{box-shadow:0 24px 70px rgba(0,0,0,.58)}}@media(max-width:1100px){.haswolf-yang-index{position:relative;right:auto;top:auto;z-index:2;width:auto;margin:12px 14px 0}}@media(max-width:640px){.haswolf-yang-index{margin:10px 10px 0;border-radius:13px}.haswolf-yang-index__head{padding:12px}.haswolf-yang-index__row{grid-template-columns:1fr .95fr .95fr;padding:9px 4px}.haswolf-yang-index__row b{font-size:11px}.haswolf-yang-index__row small{font-size:7px}}
      `}</style>
    </aside>
  );
}
