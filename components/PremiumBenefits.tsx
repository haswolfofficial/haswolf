"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";

export default function PremiumBenefits() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tier, setTier] = useState("normal");
  const [until, setUntil] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    let alive = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("premium_tier,premium_until").eq("id", user.id).maybeSingle();
      if (alive) {
        setTier(data?.premium_tier || "normal");
        setUntil(data?.premium_until || null);
      }
    }
    void load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const premium = tier !== "normal" && (!until || new Date(until) > new Date());

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={premium ? "haswolf-premium-trigger is-premium" : "haswolf-premium-trigger"}>
        <span>🔥</span><b>{premium ? "Premium Hesabım" : "Premium"}</b>{premium && <em>{tier}</em>}
      </button>
      {mounted && open && createPortal(
        <div className="haswolf-modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <aside className="haswolf-premium-panel haswolf-modal-card" role="dialog" aria-modal="true" aria-labelledby="premium-title">
            <header>
              <div><small>HASWOLF ELITE</small><h2 id="premium-title">Premium Üyelik</h2></div>
              <button type="button" className="haswolf-panel-close" onClick={() => setOpen(false)} aria-label="Premium panelini kapat">✕</button>
            </header>
            <div className="haswolf-premium-hero"><span>🔥</span><div><strong>{premium ? `${tier.toUpperCase()} AKTİF` : "Premium Dünyasına Katıl"}</strong><small>{until ? `${new Date(until).toLocaleDateString("tr-TR")} tarihine kadar` : "Hesabına özel avantajlar"}</small></div></div>
            <ul><li>Altın ve alevli profil çerçevesi</li><li>Özel sohbet ve lonca rozeti</li><li>Öncelikli destek ve kampanyalar</li><li>Daha fazla favori ve fiyat alarmı</li><li>Premium etkinlik ve çekilişleri</li></ul>
            <a href="/hesabim">Üyeliğimi görüntüle</a>
          </aside>
        </div>, document.body)}
    </>
  );
}
