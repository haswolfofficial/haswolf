"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Campaign = {
  id: number;
  title: string;
  body: string | null;
  campaign_type: string;
  target_audience: string;
  starts_at: string | null;
  ends_at: string | null;
  sound_enabled: boolean;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
};

export default function CampaignRenderer() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("campaigns")
        .select("id,title,body,campaign_type,target_audience,starts_at,ends_at,sound_enabled,desktop_image_url,mobile_image_url,link_url")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("created_at", { ascending: false });
      setRows((data || []) as Campaign[]);
    }

    void load();
    const channel = supabase
      .channel("campaigns-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, () => void load())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  const visible = useMemo(() => rows.filter((item) => !dismissed.includes(item.id)), [rows, dismissed]);
  if (!visible.length) return null;

  const ticker = visible.find((item) => item.campaign_type === "ticker");
  const popup = visible.find((item) => item.campaign_type === "popup");
  const banners = visible.filter((item) => item.campaign_type === "banner").slice(0, 2);
  const sideAds = visible.filter((item) => item.campaign_type === "side").slice(0, 2);
  const countdown = visible.find((item) => item.campaign_type === "countdown");

  function dismiss(id: number) {
    setDismissed((current) => [...current, id]);
  }

  function AdCreative({ item, compact = false }: { item: Campaign; compact?: boolean }) {
    const inner = (
      <>
        <picture>
          {item.mobile_image_url && <source media="(max-width: 700px)" srcSet={item.mobile_image_url} />}
          {item.desktop_image_url && <img src={item.desktop_image_url} alt={item.title} loading="lazy" />}
        </picture>
        <div className="haswolf-ad-copy">
          <small>REKLAM</small>
          <strong>{item.title}</strong>
          {!compact && item.body && <p>{item.body}</p>}
          {item.link_url && <span>İncele →</span>}
        </div>
      </>
    );

    return item.link_url ? (
      <a className="haswolf-ad-creative" href={item.link_url} target="_blank" rel="noopener noreferrer sponsored">{inner}</a>
    ) : (
      <div className="haswolf-ad-creative">{inner}</div>
    );
  }

  return (
    <>
      {ticker && (
        <div className="haswolf-ad-ticker" role="region" aria-label="Sponsor duyurusu">
          <span className="haswolf-ad-ticker__badge">SPONSOR</span>
          <div className="haswolf-ad-ticker__track">
            <div>{ticker.title} {ticker.body ? `• ${ticker.body}` : ""}</div>
            <div aria-hidden="true">{ticker.title} {ticker.body ? `• ${ticker.body}` : ""}</div>
          </div>
          {ticker.link_url && <a href={ticker.link_url} target="_blank" rel="noopener noreferrer sponsored">Detay</a>}
          <button type="button" onClick={() => dismiss(ticker.id)} aria-label="Kayan reklamı kapat">×</button>
        </div>
      )}

      {banners.length > 0 && (
        <div className="haswolf-ad-banner-stack" aria-label="Sponsor alanı">
          {banners.map((item) => (
            <article key={item.id} className="haswolf-ad-banner">
              <AdCreative item={item} />
              <button type="button" onClick={() => dismiss(item.id)} aria-label="Reklamı kapat">×</button>
            </article>
          ))}
        </div>
      )}

      {sideAds.map((item, index) => (
        <aside key={item.id} className={`haswolf-ad-rail haswolf-ad-rail--${index === 0 ? "left" : "right"}`}>
          <AdCreative item={item} compact />
          <button type="button" onClick={() => dismiss(item.id)} aria-label="Reklamı kapat">×</button>
        </aside>
      ))}

      {countdown && countdown.ends_at && (
        <a className="haswolf-ad-countdown" href={countdown.link_url || "#"} target={countdown.link_url ? "_blank" : undefined} rel={countdown.link_url ? "noopener noreferrer sponsored" : undefined}>
          <small>ÖZEL KAMPANYA</small>
          <strong>{countdown.title}</strong>
          <span>{countdown.body || "Süreli fırsat"}</span>
        </a>
      )}

      {popup && (
        <div className="haswolf-ad-popup-layer" onMouseDown={(event) => event.target === event.currentTarget && dismiss(popup.id)}>
          <section className="haswolf-ad-popup" role="dialog" aria-modal="true" aria-label={popup.title}>
            <button type="button" className="haswolf-ad-popup__close" onClick={() => dismiss(popup.id)} aria-label="Reklamı kapat">×</button>
            <AdCreative item={popup} />
          </section>
        </div>
      )}

      <style jsx global>{`
        .haswolf-ad-ticker{position:fixed;left:0;right:0;top:0;z-index:120;display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:12px;height:38px;padding:0 14px;border-bottom:1px solid rgba(217,170,74,.32);background:linear-gradient(90deg,#060807,#141006,#060807);box-shadow:0 8px 30px rgba(0,0,0,.35);overflow:hidden}.haswolf-ad-ticker__badge{font-size:9px;font-weight:900;letter-spacing:.16em;color:#171006;background:linear-gradient(135deg,#f5d06b,#c38a20);padding:5px 8px;border-radius:6px}.haswolf-ad-ticker__track{overflow:hidden;white-space:nowrap;color:#f4d37e;font-size:11px;font-weight:800;letter-spacing:.08em}.haswolf-ad-ticker__track>div{display:inline-block;min-width:100%;padding-left:100%;animation:haswolfTicker 24s linear infinite}.haswolf-ad-ticker__track>div+div{animation-delay:-12s}.haswolf-ad-ticker a{color:#fff;font-size:10px;font-weight:900;text-decoration:none}.haswolf-ad-ticker button,.haswolf-ad-banner>button,.haswolf-ad-rail>button{border:0;background:rgba(255,255,255,.06);color:#aaa;width:26px;height:26px;border-radius:8px;cursor:pointer}@keyframes haswolfTicker{from{transform:translateX(0)}to{transform:translateX(-100%)}}
        .haswolf-ad-banner-stack{position:fixed;left:50%;top:88px;z-index:72;transform:translateX(-50%);display:grid;gap:10px;width:min(760px,calc(100vw - 32px));pointer-events:none}.haswolf-ad-banner{position:relative;border:1px solid rgba(217,170,74,.28);border-radius:16px;background:rgba(7,9,9,.94);box-shadow:0 18px 50px rgba(0,0,0,.45),inset 0 1px rgba(255,255,255,.04);overflow:hidden;pointer-events:auto}.haswolf-ad-banner>button{position:absolute;right:8px;top:8px;z-index:3}.haswolf-ad-banner .haswolf-ad-creative{display:grid;grid-template-columns:minmax(150px,240px) 1fr;min-height:94px}.haswolf-ad-banner picture{min-height:94px}.haswolf-ad-banner img{width:100%;height:100%;object-fit:cover}.haswolf-ad-copy{padding:14px 18px;display:flex;flex-direction:column;justify-content:center}.haswolf-ad-copy small{color:#8a784d;font-size:8px;font-weight:900;letter-spacing:.16em}.haswolf-ad-copy strong{margin-top:4px;color:#fff;font-size:14px}.haswolf-ad-copy p{margin:5px 0 0;color:#9ba0a0;font-size:11px;line-height:1.45}.haswolf-ad-copy span{margin-top:7px;color:#e4b753;font-size:10px;font-weight:900}.haswolf-ad-creative{color:inherit;text-decoration:none}
        .haswolf-ad-rail{position:fixed;top:50%;z-index:68;width:150px;transform:translateY(-50%);border:1px solid rgba(217,170,74,.24);border-radius:15px;background:rgba(7,9,9,.96);box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden}.haswolf-ad-rail--left{left:14px}.haswolf-ad-rail--right{right:14px}.haswolf-ad-rail picture{display:block;height:220px;background:#060707}.haswolf-ad-rail img{width:100%;height:100%;object-fit:cover}.haswolf-ad-rail .haswolf-ad-copy{padding:11px}.haswolf-ad-rail .haswolf-ad-copy strong{font-size:11px}.haswolf-ad-rail>button{position:absolute;right:7px;top:7px;z-index:3;background:rgba(0,0,0,.72)}
        .haswolf-ad-countdown{position:fixed;right:18px;bottom:104px;z-index:69;display:flex;flex-direction:column;min-width:210px;padding:13px 15px;border:1px solid rgba(217,170,74,.32);border-radius:14px;background:linear-gradient(145deg,rgba(36,27,9,.96),rgba(7,9,9,.98));box-shadow:0 15px 45px rgba(0,0,0,.48);text-decoration:none}.haswolf-ad-countdown small{color:#d9aa4a;font-size:8px;font-weight:900;letter-spacing:.14em}.haswolf-ad-countdown strong{margin-top:4px;color:#fff;font-size:12px}.haswolf-ad-countdown span{margin-top:3px;color:#8f9696;font-size:10px}
        .haswolf-ad-popup-layer{position:fixed;inset:0;z-index:140;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)}.haswolf-ad-popup{position:relative;width:min(560px,100%);overflow:hidden;border:1px solid rgba(217,170,74,.45);border-radius:22px;background:#080a0a;box-shadow:0 30px 100px rgba(0,0,0,.65),0 0 70px rgba(217,170,74,.12)}.haswolf-ad-popup__close{position:absolute;right:12px;top:12px;z-index:4;width:38px;height:38px;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:rgba(0,0,0,.74);color:#fff;font-size:20px}.haswolf-ad-popup picture{display:block;max-height:320px;background:#050606}.haswolf-ad-popup img{display:block;width:100%;max-height:320px;object-fit:cover}.haswolf-ad-popup .haswolf-ad-copy{padding:20px 22px 24px}.haswolf-ad-popup .haswolf-ad-copy strong{font-size:20px}.haswolf-ad-popup .haswolf-ad-copy p{font-size:13px}
        @media(max-width:1180px){.haswolf-ad-rail{display:none}}@media(max-width:700px){.haswolf-ad-ticker{grid-template-columns:auto 1fr auto;height:34px;padding:0 8px}.haswolf-ad-ticker a{display:none}.haswolf-ad-ticker__badge{font-size:7px;padding:4px 6px}.haswolf-ad-banner-stack{top:72px;width:calc(100vw - 20px)}.haswolf-ad-banner .haswolf-ad-creative{grid-template-columns:92px 1fr;min-height:78px}.haswolf-ad-banner picture{min-height:78px}.haswolf-ad-banner .haswolf-ad-copy{padding:10px 12px}.haswolf-ad-banner .haswolf-ad-copy p{display:none}.haswolf-ad-countdown{right:10px;bottom:88px;min-width:180px}.haswolf-ad-popup picture{max-height:240px}.haswolf-ad-popup img{max-height:240px}}
      `}</style>
    </>
  );
}
