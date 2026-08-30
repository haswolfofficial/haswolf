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
      const { data, error } = await supabase
        .from("campaigns")
        .select("id,title,body,campaign_type,target_audience,starts_at,ends_at,sound_enabled,desktop_image_url,mobile_image_url,link_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("HASWOLF campaigns load error:", error.message);
        setRows([]);
        return;
      }

      const now = Date.now();
      const filtered = ((data || []) as Campaign[]).filter((item) => {
        const startsOk = !item.starts_at || new Date(item.starts_at).getTime() <= now;
        const endsOk = !item.ends_at || new Date(item.ends_at).getTime() >= now;
        return startsOk && endsOk;
      });

      setRows(filtered);
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
        {(item.desktop_image_url || item.mobile_image_url) && (
          <picture>
            {item.mobile_image_url && <source media="(max-width: 700px)" srcSet={item.mobile_image_url} />}
            {item.desktop_image_url && <img src={item.desktop_image_url} alt={item.title} loading="lazy" />}
          </picture>
        )}
        <div className="haswolf-ad-copy">
          <small>HASWOLF REKLAM</small>
          <strong>{item.title}</strong>
          {!compact && item.body && <p>{item.body}</p>}
          {item.link_url && <span>Detayları Gör →</span>}
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
          <span className="haswolf-ad-ticker__badge">DUYURU</span>
          <div className="haswolf-ad-ticker__track">
            <div>{ticker.title} {ticker.body ? `• ${ticker.body}` : ""}</div>
          </div>
          {ticker.link_url && <a href={ticker.link_url} target="_blank" rel="noopener noreferrer sponsored">İNCELE</a>}
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

      {countdown && (
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
        .haswolf-ad-ticker{position:fixed;left:50%;top:10px;z-index:160;transform:translateX(-50%);display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:12px;width:min(1180px,calc(100vw - 28px));height:42px;padding:0 10px 0 12px;border:1px solid rgba(217,170,74,.36);border-radius:14px;background:linear-gradient(90deg,rgba(8,10,10,.98),rgba(31,24,9,.96),rgba(8,10,10,.98));box-shadow:0 16px 50px rgba(0,0,0,.48),0 0 45px rgba(217,170,74,.08);backdrop-filter:blur(14px);overflow:hidden}.haswolf-ad-ticker__badge{font-size:8px;font-weight:950;letter-spacing:.16em;color:#171006;background:linear-gradient(135deg,#f5d06b,#c38a20);padding:6px 8px;border-radius:8px}.haswolf-ad-ticker__track{overflow:hidden;white-space:nowrap;color:#f5d983;font-size:11px;font-weight:850;letter-spacing:.045em}.haswolf-ad-ticker__track>div{display:inline-block;min-width:100%;padding-left:100%;animation:haswolfTicker 22s linear infinite}.haswolf-ad-ticker a{color:#fff;font-size:9px;font-weight:950;text-decoration:none;letter-spacing:.08em}.haswolf-ad-ticker button,.haswolf-ad-banner>button,.haswolf-ad-rail>button{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#b9b9b9;width:28px;height:28px;border-radius:9px;cursor:pointer}@keyframes haswolfTicker{from{transform:translateX(0)}to{transform:translateX(-100%)}}
        .haswolf-ad-banner-stack{position:fixed;left:50%;top:66px;z-index:95;transform:translateX(-50%);display:grid;gap:10px;width:min(820px,calc(100vw - 32px));pointer-events:none}.haswolf-ad-banner{position:relative;border:1px solid rgba(217,170,74,.28);border-radius:18px;background:linear-gradient(145deg,rgba(10,12,12,.97),rgba(17,13,6,.96));box-shadow:0 22px 65px rgba(0,0,0,.48),0 0 45px rgba(217,170,74,.07),inset 0 1px rgba(255,255,255,.04);overflow:hidden;pointer-events:auto}.haswolf-ad-banner>button{position:absolute;right:10px;top:10px;z-index:3}.haswolf-ad-banner .haswolf-ad-creative{display:grid;grid-template-columns:minmax(150px,250px) 1fr;min-height:100px}.haswolf-ad-banner picture{min-height:100px}.haswolf-ad-banner img{width:100%;height:100%;object-fit:cover}.haswolf-ad-copy{padding:16px 20px;display:flex;flex-direction:column;justify-content:center}.haswolf-ad-copy small{color:#9f874d;font-size:8px;font-weight:950;letter-spacing:.18em}.haswolf-ad-copy strong{margin-top:5px;color:#fff;font-size:15px}.haswolf-ad-copy p{margin:6px 0 0;color:#a6adac;font-size:11px;line-height:1.5}.haswolf-ad-copy span{margin-top:8px;color:#e7bc55;font-size:10px;font-weight:950}.haswolf-ad-creative{color:inherit;text-decoration:none}
        .haswolf-ad-rail{position:fixed;top:50%;z-index:82;width:154px;transform:translateY(-50%);border:1px solid rgba(217,170,74,.24);border-radius:16px;background:rgba(7,9,9,.98);box-shadow:0 24px 70px rgba(0,0,0,.52),0 0 40px rgba(217,170,74,.06);overflow:hidden}.haswolf-ad-rail--left{left:14px}.haswolf-ad-rail--right{right:14px}.haswolf-ad-rail picture{display:block;height:220px;background:#060707}.haswolf-ad-rail img{width:100%;height:100%;object-fit:cover}.haswolf-ad-rail .haswolf-ad-copy{padding:12px}.haswolf-ad-rail .haswolf-ad-copy strong{font-size:11px}.haswolf-ad-rail>button{position:absolute;right:7px;top:7px;z-index:3;background:rgba(0,0,0,.76)}
        .haswolf-ad-countdown{position:fixed;right:20px;bottom:150px;z-index:84;display:flex;flex-direction:column;min-width:220px;padding:14px 16px;border:1px solid rgba(217,170,74,.34);border-radius:15px;background:linear-gradient(145deg,rgba(38,28,9,.97),rgba(7,9,9,.99));box-shadow:0 18px 55px rgba(0,0,0,.52);text-decoration:none}.haswolf-ad-countdown small{color:#d9aa4a;font-size:8px;font-weight:950;letter-spacing:.14em}.haswolf-ad-countdown strong{margin-top:4px;color:#fff;font-size:12px}.haswolf-ad-countdown span{margin-top:4px;color:#929998;font-size:10px}
        .haswolf-ad-popup-layer{position:fixed;inset:0;z-index:180;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.76);backdrop-filter:blur(10px)}.haswolf-ad-popup{position:relative;width:min(580px,100%);overflow:hidden;border:1px solid rgba(217,170,74,.46);border-radius:24px;background:#080a0a;box-shadow:0 34px 110px rgba(0,0,0,.68),0 0 80px rgba(217,170,74,.12)}.haswolf-ad-popup__close{position:absolute;right:12px;top:12px;z-index:4;width:40px;height:40px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(0,0,0,.78);color:#fff;font-size:20px}.haswolf-ad-popup picture{display:block;max-height:330px;background:#050606}.haswolf-ad-popup img{display:block;width:100%;max-height:330px;object-fit:cover}.haswolf-ad-popup .haswolf-ad-copy{padding:22px 24px 26px}.haswolf-ad-popup .haswolf-ad-copy strong{font-size:21px}.haswolf-ad-popup .haswolf-ad-copy p{font-size:13px}
        @media(max-width:1180px){.haswolf-ad-rail{display:none}}@media(max-width:700px){.haswolf-ad-ticker{top:8px;grid-template-columns:auto 1fr auto;height:38px;width:calc(100vw - 16px);padding:0 8px}.haswolf-ad-ticker a{display:none}.haswolf-ad-ticker__badge{font-size:7px;padding:5px 6px}.haswolf-ad-banner-stack{top:56px;width:calc(100vw - 18px)}.haswolf-ad-banner .haswolf-ad-creative{grid-template-columns:92px 1fr;min-height:82px}.haswolf-ad-banner picture{min-height:82px}.haswolf-ad-banner .haswolf-ad-copy{padding:10px 12px}.haswolf-ad-banner .haswolf-ad-copy p{display:none}.haswolf-ad-countdown{right:10px;bottom:124px;min-width:185px}.haswolf-ad-popup picture{max-height:250px}.haswolf-ad-popup img{max-height:250px}}
      `}</style>
    </>
  );
}
