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
              <span><b>₺{formatTl(market.current)}</b><small className="haswolf-yang-index__previous">Önceki ₺{formatTl(market.previous)}</small></span>
              <span className="haswolf-yang-index__change"><b>{symbol} %{Math.abs(market.change).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</b><small>{direction === "up" ? "Yükseliş" : direction === "down" ? "Düşüş" : "Sabit"}</small></span>
            </div>
          );
        })}
      </div>
      <div className="haswolf-yang-index__notice"><b>Fiyatlar canlı piyasaya göre hesaplanır.</b><span>Piyasa koşulları değişkendir; endeks son fiyat hareketini gösterir. Yönetim yalnızca güncel satış fiyatını sisteme işler.</span></div>
      <style jsx global>{`
        .haswolf-yang-index{position:fixed;right:18px;top:250px;z-index:44;width:min(340px,calc(100vw - 28px));overflow:hidden;border:1px solid #d8c79d;border-radius:14px;background:#fff;color:#111827;box-shadow:0 18px 48px rgba(0,0,0,.28);transition:box-shadow .3s ease,transform .3s ease}.haswolf-yang-index:hover{transform:translateY(-2px);box-shadow:0 22px 58px rgba(0,0,0,.34)}.haswolf-yang-index.is-pulsing{animation:haswolfIndexPulse .65s ease}.haswolf-yang-index__head{display:flex;align-items:center;justify-content:space-between;padding:11px 13px 10px;border-bottom:1px solid #eadfca;background:linear-gradient(135deg,#fffdf7,#f7f0df)}.haswolf-yang-index__head>div{display:grid;gap:1px}.haswolf-yang-index__head strong{font-size:12px;letter-spacing:.09em;color:#8a5a0a}.haswolf-yang-index__head small{font-size:9px;color:#6b7280}.haswolf-yang-index__live{display:flex;align-items:center;gap:5px;font-size:8px;font-weight:900;letter-spacing:.12em;color:#15803d}.haswolf-yang-index__live i{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;animation:haswolfLive 1.6s infinite}.haswolf-yang-index__badge{display:grid;place-items:center;width:34px;height:34px;border:1px solid #d6b96d;border-radius:9px;background:#fff7df;font-size:9px;font-weight:900;letter-spacing:.08em;color:#9a6700}.haswolf-yang-index__table{padding:5px 9px}.haswolf-yang-index__row{display:grid;grid-template-columns:1fr .95fr .82fr;align-items:center;gap:7px;padding:8px 5px;border-bottom:1px solid #eceff3}.haswolf-yang-index__row:last-child{border-bottom:0}.haswolf-yang-index__row>span{display:grid;gap:1px;min-width:0}.haswolf-yang-index__row b{font-size:11px;color:#111827}.haswolf-yang-index__row small{font-size:7px;color:#7b8492;white-space:nowrap}.haswolf-yang-index__row .haswolf-yang-index__previous{margin-top:2px;font-size:9px;font-weight:800;color:#4b5563}.haswolf-yang-index__labels{padding-top:3px;padding-bottom:4px}.haswolf-yang-index__labels span{font-size:7px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#8b93a0}.haswolf-yang-index__change b{font-variant-numeric:tabular-nums}.haswolf-yang-index__row.is-up .haswolf-yang-index__change b{color:#15803d}.haswolf-yang-index__row.is-down .haswolf-yang-index__change b{color:#dc2626}.haswolf-yang-index__row.is-flat .haswolf-yang-index__change b{color:#6b7280}.haswolf-yang-index__notice{display:grid;gap:2px;border-top:1px solid #eadfca;background:#fff9e9;padding:8px 11px}.haswolf-yang-index__notice b{font-size:9px;color:#8a5a0a}.haswolf-yang-index__notice span{font-size:7.5px;line-height:1.4;color:#6b7280}@keyframes haswolfLive{0%,100%{opacity:.45}50%{opacity:1}}@keyframes haswolfIndexPulse{0%{box-shadow:0 18px 48px rgba(0,0,0,.28)}45%{box-shadow:0 18px 48px rgba(0,0,0,.28),0 0 0 4px rgba(217,170,74,.18)}100%{box-shadow:0 18px 48px rgba(0,0,0,.28)}}@media(max-width:1100px){.haswolf-yang-index{position:relative;right:auto;top:auto;z-index:2;width:auto;max-width:520px;margin:12px auto 0}}@media(max-width:640px){.haswolf-yang-index{margin:10px;border-radius:12px}.haswolf-yang-index__row{grid-template-columns:1fr .95fr .9fr;padding:8px 3px}.haswolf-yang-index__row b{font-size:10px}.haswolf-yang-index__row .haswolf-yang-index__previous{font-size:8px}}
      `}</style>
    </aside>
  );
}
