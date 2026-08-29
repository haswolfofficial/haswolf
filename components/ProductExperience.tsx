"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type ProductLite = {
  id: number;
  name: string;
  price: number;
  old_price?: number | null;
  server: string;
  category: "item" | "yang" | "dc" | "account";
  stock: number;
  delivery_time?: string | null;
  view_count?: number | null;
  image_url?: string | null;
  favorite_count?: number | null;
  is_daily_favorite?: boolean | null;
  is_best_price?: boolean | null;
  low_stock_alert?: boolean | null;
};

const FAVORITES_KEY = "haswolf_favorites_v1";
const COMPARE_KEY = "haswolf_compare_v1";
const MAX_YANG_M = 20000;

function getGuestKey() {
  let key = localStorage.getItem("haswolf_guest_key");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("haswolf_guest_key", key);
  }
  return key;
}

function getYangReferenceAmount(name: string) {
  const lower = name.toLocaleLowerCase("tr-TR");
  const parenthetical = lower.match(/\((\d[\d.,]*)\s*m\)/i);
  const direct = lower.match(/(\d[\d.,]*)\s*m\b/i);
  const match = parenthetical || direct;
  if (match) {
    const normalized = match[1].replace(/\./g, "").replace(",", ".");
    const value = Number(normalized);
    if (Number.isFinite(value) && value > 0) return value;
  }
  if (/\b1\s*t\b/i.test(lower)) return 1000;
  return 0;
}

function formatTl(value: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function formatYangAmount(value: number) {
  const m = Math.max(0, Math.min(MAX_YANG_M, Math.floor(value)));
  const mText = `${m.toLocaleString("tr-TR")} M`;
  if (m < 1000) return mText;
  const t = m / 1000;
  const tText = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 }).format(t);
  return `${mText} (${tText} T)`;
}

export default function ProductExperience({ product, compact = false }: { product: ProductLite; compact?: boolean }) {
  const [favorite, setFavorite] = useState(false);
  const [compared, setCompared] = useState(false);
  const [views, setViews] = useState(product.view_count ?? 0);
  const [favoriteCount, setFavoriteCount] = useState(product.favorite_count ?? 0);
  const [yangAmount, setYangAmount] = useState("100");

  const yangReferenceAmount = useMemo(() => (product.category === "yang" ? getYangReferenceAmount(product.name) : 0), [product.category, product.name]);
  const isYangReference = product.category === "yang" && yangReferenceAmount >= 1000;
  const yangUnitPrice = isYangReference ? product.price / yangReferenceAmount : 0;
  const rawYangAmount = Number(yangAmount) || 0;
  const numericYangAmount = Math.max(0, Math.min(MAX_YANG_M, Math.floor(rawYangAmount)));
  const yangTotal = yangUnitPrice * numericYangAmount;

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]") as number[];
    const comparedProducts = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]") as ProductLite[];
    setFavorite(favorites.includes(product.id));
    setCompared(comparedProducts.some((item) => item.id === product.id));
    const viewedKey = `haswolf_viewed_${product.id}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, "1");
      setViews((current) => current + 1);
      void supabase.rpc("increment_product_view", { product_id_input: product.id });
    }
  }, [product.id]);

  async function toggleFavorite() {
    const current = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]") as number[];
    const isAlreadyFavorite = current.includes(product.id);
    const next = isAlreadyFavorite ? current.filter((id) => id !== product.id) : [...current, product.id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setFavorite(!isAlreadyFavorite);
    setFavoriteCount((count) => Math.max(0, count + (isAlreadyFavorite ? -1 : 1)));
    window.dispatchEvent(new Event("haswolf:favorites"));
    const { data: { user } } = await supabase.auth.getUser();
    if (!isAlreadyFavorite) {
      await supabase.from("product_favorites").upsert({ user_id: user?.id ?? null, guest_key: user ? null : getGuestKey(), product_id: product.id });
      return;
    }
    if (user) await supabase.from("product_favorites").delete().eq("product_id", product.id).eq("user_id", user.id);
    else await supabase.from("product_favorites").delete().eq("product_id", product.id).eq("guest_key", getGuestKey());
  }

  function toggleCompare() {
    const current = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]") as ProductLite[];
    const exists = current.some((item) => item.id === product.id);
    const next = exists ? current.filter((item) => item.id !== product.id) : [...current, product].slice(-3);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    setCompared(!exists);
    window.dispatchEvent(new Event("haswolf:compare"));
  }

  async function shareProduct() {
    const url = `${location.origin}/?product=${product.id}#market`;
    const unit = product.category === "dc" ? "M" : "TL";
    const text = `${product.name} - ${product.price.toLocaleString("tr-TR")} ${unit}`;
    if (navigator.share) { await navigator.share({ title: product.name, text, url }); return; }
    await navigator.clipboard.writeText(url);
    window.alert("Ürün bağlantısı kopyalandı.");
  }

  function buyFlexibleYang() {
    if (!isYangReference || numericYangAmount < 1 || rawYangAmount > MAX_YANG_M) return;
    const amountLabel = formatYangAmount(numericYangAmount);
    const message = encodeURIComponent(`Merhaba Haswolf, ${product.server} sunucusundan ${amountLabel} Yang almak istiyorum. 1 M fiyatı ${formatTl(yangUnitPrice)} TL, hesaplanan toplam ${formatTl(yangTotal)} TL.`);
    window.open(`https://wa.me/905010942080?text=${message}`, "_blank", "noopener,noreferrer");
  }

  if (product.category === "yang" && !isYangReference) return <><span className="haswolf-yang-suppress" aria-hidden="true" /><style jsx global>{`.haswolf-yang-card:has(.haswolf-yang-suppress){display:none!important;}`}</style></>;

  if (isYangReference) {
    const invalidHigh = rawYangAmount > MAX_YANG_M;
    return (
      <div className="haswolf-yang-flexible-calculator">
        <div className="haswolf-yang-flexible-calculator__heading"><div><strong>İstediğin miktarı yaz</strong><span>1 M = {formatTl(yangUnitPrice)} TL</span></div><b>{product.server}</b></div>
        <label><span>Yang miktarı (M)</span><div><input type="number" min="1" max={MAX_YANG_M} step="1" inputMode="numeric" value={yangAmount} onChange={(event) => setYangAmount(event.target.value)} onBlur={() => { if (rawYangAmount > MAX_YANG_M) setYangAmount(String(MAX_YANG_M)); }} placeholder="Örn. 558" /><em>{numericYangAmount >= 1000 ? `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 }).format(numericYangAmount / 1000)} T` : "M"}</em></div></label>
        {invalidHigh && <div className="haswolf-yang-limit-warning">En fazla 20.000 M (20 T) satın alabilirsin.</div>}
        <div className="haswolf-yang-flexible-calculator__total"><span>Hesaplanan toplam</span><strong>{numericYangAmount >= 1 ? `${formatTl(yangTotal)} TL` : "—"}</strong></div>
        <p>1–20.000 M arasında istediğin miktarı yazabilirsin. 1.000 M = 1 T.</p>
        <button type="button" onClick={buyFlexibleYang} disabled={numericYangAmount < 1 || invalidHigh}>WhatsApp ile {numericYangAmount >= 1 ? formatYangAmount(numericYangAmount) : "Yang"} Satın Al</button>
        <style jsx global>{`
          .haswolf-yang-card:has(.haswolf-yang-flexible-calculator) .haswolf-yang-card__title-row,.haswolf-yang-card:has(.haswolf-yang-flexible-calculator) .haswolf-yang-card__description,.haswolf-yang-card:has(.haswolf-yang-flexible-calculator)>.haswolf-yang-card__content>.haswolf-yang-card__meta{display:none!important}.haswolf-yang-card:has(.haswolf-yang-flexible-calculator) .haswolf-yang-card__media{min-height:92px}.haswolf-yang-flexible-calculator{margin-top:8px;display:grid;gap:12px}.haswolf-yang-flexible-calculator__heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.haswolf-yang-flexible-calculator__heading strong{display:block;font-size:16px;color:#f2ca68}.haswolf-yang-flexible-calculator__heading span{display:block;margin-top:3px;font-size:12px;color:#a1a1aa}.haswolf-yang-flexible-calculator__heading b{font-size:11px;color:var(--server-color,#d9aa4a)}.haswolf-yang-flexible-calculator label>span{display:block;margin-bottom:6px;font-size:12px;color:#d4d4d8}.haswolf-yang-flexible-calculator label>div{display:flex;align-items:center;overflow:hidden;border:1px solid rgba(217,170,74,.45);border-radius:10px;background:#050606}.haswolf-yang-flexible-calculator input{min-width:0;flex:1;border:0;outline:0;background:transparent;padding:12px 14px;color:white;font-size:18px;font-weight:800}.haswolf-yang-flexible-calculator label em{min-width:62px;padding:0 12px;text-align:center;color:#e7b74f;font-style:normal;font-weight:900}.haswolf-yang-limit-warning{border:1px solid rgba(239,68,68,.45);border-radius:8px;background:rgba(127,29,29,.18);padding:8px 10px;color:#fca5a5;font-size:11px;font-weight:700}.haswolf-yang-flexible-calculator__total{display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);padding:11px 13px}.haswolf-yang-flexible-calculator__total span{color:#a1a1aa;font-size:12px}.haswolf-yang-flexible-calculator__total strong{color:#f3c95f;font-size:17px;overflow-wrap:anywhere;text-align:right}.haswolf-yang-flexible-calculator p{margin:0;color:#71717a;font-size:11px}.haswolf-yang-flexible-calculator>button{width:100%;border:1px solid rgba(74,222,128,.5);border-radius:10px;background:linear-gradient(#15803d,#14532d);padding:12px 14px;color:white;font-size:13px;font-weight:800;overflow-wrap:anywhere}.haswolf-yang-flexible-calculator>button:disabled{opacity:.45;cursor:not-allowed}
        `}</style>
      </div>
    );
  }

  const stockLabel = product.stock <= 2 || product.low_stock_alert ? `Stok azalıyor · ${product.stock}` : `Stok ${product.stock}`;
  return <div className={compact ? "haswolf-product-xp is-compact" : "haswolf-product-xp"}>{(product.is_daily_favorite || product.is_best_price) && <div className="haswolf-product-badges">{product.is_daily_favorite && <b>⭐ BUGÜNÜN FAVORİSİ</b>}{product.is_best_price && <b>🏆 EN UYGUN FİYAT</b>}</div>}<div className="haswolf-product-xp__meta"><span>Görüntülenme: {views.toLocaleString("tr-TR")}</span><span>Favorileyen: {favoriteCount.toLocaleString("tr-TR")}</span><span>Teslimat: {product.delivery_time || "1 saat"}</span><span className={product.stock <= 2 || product.low_stock_alert ? "is-low-stock" : ""}>{stockLabel}</span></div><div className="haswolf-product-xp__actions"><button type="button" className={favorite ? "is-active" : ""} onClick={toggleFavorite}>{favorite ? "Favoride" : "Favoriye Ekle"}</button><button type="button" className={compared ? "is-active" : ""} onClick={toggleCompare}>Karşılaştır</button><button type="button" onClick={shareProduct}>Paylaş</button></div></div>;
}
