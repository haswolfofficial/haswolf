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
const MAX_DC = 20000;
const DC_PACKAGES = [2700, 2400, 2125, 1850, 1575, 1300, 1000, 750, 500, 250, 200, 100] as const;

function formatDcPackage(pack: number) {
  const bonusPackages: Record<number, string> = {
    1300: "1.250 + 50 HEDİYE = 1.300",
    1575: "1.500 + 75 HEDİYE = 1.575",
    1850: "1.750 + 100 HEDİYE = 1.850",
    2125: "2.000 + 125 HEDİYE = 2.125",
    2400: "2.250 + 150 HEDİYE = 2.400",
    2700: "2.500 + 200 HEDİYE = 2.700",
  };
  return bonusPackages[pack] ?? pack.toLocaleString("tr-TR");
}

function getDcPaidAmount(pack: number) {
  const paidAmounts: Record<number, number> = { 1300: 1250, 1575: 1500, 1850: 1750, 2125: 2000, 2400: 2250, 2700: 2500 };
  return paidAmounts[pack] ?? pack;
}

function getGuestKey() {
  let key = localStorage.getItem("haswolf_guest_key");
  if (!key) { key = crypto.randomUUID(); localStorage.setItem("haswolf_guest_key", key); }
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

function getDcReferenceAmount(name: string) {
  const match = name.match(/(\d[\d.,]*)\s*dc\b/i);
  if (!match) return 0;
  const normalized = match[1].replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function findDcPackagePlan(target: number) {
  const amount = Math.max(0, Math.min(MAX_DC, Math.floor(target)));
  if (amount < 100) return null;
  const dp: Array<number[] | null> = Array(amount + 1).fill(null);
  dp[0] = [];
  for (let total = 1; total <= amount; total++) {
    let best: number[] | null = null;
    for (const pack of DC_PACKAGES) {
      const paidAmount = getDcPaidAmount(pack);
      if (paidAmount > total || !dp[total - paidAmount]) continue;
      const candidate = [...(dp[total - paidAmount] as number[]), pack].sort((a, b) => getDcPaidAmount(b) - getDcPaidAmount(a));
      const candidateGift = candidate.reduce((sum, item) => sum + (item - getDcPaidAmount(item)), 0);
      const bestGift = best ? best.reduce((sum, item) => sum + (item - getDcPaidAmount(item)), 0) : -1;
      if (!best || candidate.length < best.length || (candidate.length === best.length && candidateGift > bestGift)) best = candidate;
    }
    dp[total] = best;
  }
  return dp[amount];
}

function nearestDcOptions(target: number) {
  const amount = Math.max(100, Math.min(MAX_DC, Math.floor(target)));
  let lower: number | null = null; let upper: number | null = null;
  for (let delta = 1; delta <= 500 && (lower === null || upper === null); delta++) {
    if (lower === null && amount - delta >= 100 && findDcPackagePlan(amount - delta)) lower = amount - delta;
    if (upper === null && amount + delta <= MAX_DC && findDcPackagePlan(amount + delta)) upper = amount + delta;
  }
  return { lower, upper };
}

function formatTl(value: number) { return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value); }
function formatYangAmount(value: number) {
  const m = Math.max(0, Math.min(MAX_YANG_M, Math.floor(value)));
  const mText = `${m.toLocaleString("tr-TR")} M`;
  if (m < 1000) return mText;
  return `${mText} (${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 }).format(m / 1000)} T)`;
}

export default function ProductExperience({ product, compact = false }: { product: ProductLite; compact?: boolean }) {
  const [favorite, setFavorite] = useState(false);
  const [compared, setCompared] = useState(false);
  const [views, setViews] = useState(product.view_count ?? 0);
  const [favoriteCount, setFavoriteCount] = useState(product.favorite_count ?? 0);
  const [yangAmount, setYangAmount] = useState("1");
  const [dcAmount, setDcAmount] = useState("100");

  const yangReferenceAmount = useMemo(() => (product.category === "yang" ? getYangReferenceAmount(product.name) : 0), [product.category, product.name]);
  const isYangReference = product.category === "yang" && yangReferenceAmount >= 1000;
  const yangUnitPrice = isYangReference ? product.price / yangReferenceAmount : 0;
  const rawYangAmount = Number(yangAmount) || 0;
  const numericYangAmount = Math.max(0, Math.min(MAX_YANG_M, Math.floor(rawYangAmount)));
  const yangDiscountPerM = numericYangAmount >= 2000 ? 0.50 : numericYangAmount >= 1000 ? 0.25 : 0;
  const yangDiscountedUnitPrice = Math.max(0, yangUnitPrice - yangDiscountPerM);
  const yangOriginalTotal = yangUnitPrice * numericYangAmount;
  const yangTotal = yangDiscountedUnitPrice * numericYangAmount;
  const hasYangDiscount = yangDiscountPerM > 0;

  const dcReferenceAmount = useMemo(() => (product.category === "dc" ? getDcReferenceAmount(product.name) : 0), [product.category, product.name]);
  const isDcReference = product.category === "dc" && dcReferenceAmount === 100;
  const dcUnitPriceM = isDcReference ? product.price / dcReferenceAmount : 0;
  const rawDcAmount = Number(dcAmount) || 0;
  const numericDcAmount = Math.max(0, Math.min(MAX_DC, Math.floor(rawDcAmount)));
  const dcPlan = useMemo(() => findDcPackagePlan(numericDcAmount), [numericDcAmount]);
  const dcPaidAmount = useMemo(() => dcPlan ? dcPlan.reduce((total, pack) => total + getDcPaidAmount(pack), 0) : 0, [dcPlan]);
  const dcDeliveredAmount = useMemo(() => dcPlan ? dcPlan.reduce((total, pack) => total + pack, 0) : 0, [dcPlan]);
  const dcGiftAmount = dcPlan ? Math.max(0, dcDeliveredAmount - dcPaidAmount) : 0;
  const dcTotalM = dcUnitPriceM * dcPaidAmount;
  const dcNearest = useMemo(() => (!dcPlan && numericDcAmount >= 100 ? nearestDcOptions(numericDcAmount) : { lower: null, upper: null }), [dcPlan, numericDcAmount]);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]") as number[];
    const comparedProducts = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]") as ProductLite[];
    setFavorite(favorites.includes(product.id)); setCompared(comparedProducts.some((item) => item.id === product.id));
    const viewedKey = `haswolf_viewed_${product.id}`;
    if (!sessionStorage.getItem(viewedKey)) { sessionStorage.setItem(viewedKey, "1"); setViews((current) => current + 1); void supabase.rpc("increment_product_view", { product_id_input: product.id }); }
  }, [product.id]);

  async function toggleFavorite() {
    const current = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]") as number[];
    const isAlreadyFavorite = current.includes(product.id);
    const next = isAlreadyFavorite ? current.filter((id) => id !== product.id) : [...current, product.id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); setFavorite(!isAlreadyFavorite); setFavoriteCount((count) => Math.max(0, count + (isAlreadyFavorite ? -1 : 1))); window.dispatchEvent(new Event("haswolf:favorites"));
    const { data: { user } } = await supabase.auth.getUser();
    if (!isAlreadyFavorite) { await supabase.from("product_favorites").upsert({ user_id: user?.id ?? null, guest_key: user ? null : getGuestKey(), product_id: product.id }); return; }
    if (user) await supabase.from("product_favorites").delete().eq("product_id", product.id).eq("user_id", user.id); else await supabase.from("product_favorites").delete().eq("product_id", product.id).eq("guest_key", getGuestKey());
  }

  function toggleCompare() {
    const current = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]") as ProductLite[];
    const exists = current.some((item) => item.id === product.id);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(exists ? current.filter((item) => item.id !== product.id) : [...current, product].slice(-3)));
    setCompared(!exists); window.dispatchEvent(new Event("haswolf:compare"));
  }

  async function shareProduct() {
    const url = `${location.origin}/?product=${product.id}#market`; const unit = product.category === "dc" ? "M" : "TL"; const text = `${product.name} - ${product.price.toLocaleString("tr-TR")} ${unit}`;
    if (navigator.share) { await navigator.share({ title: product.name, text, url }); return; }
    await navigator.clipboard.writeText(url); window.alert("Ürün bağlantısı kopyalandı.");
  }

  function buyFlexibleYang() {
    if (!isYangReference || numericYangAmount < 1 || rawYangAmount > MAX_YANG_M) return;
    const amountLabel = formatYangAmount(numericYangAmount);
    const discountText = hasYangDiscount ? ` Toplu alım indirimiyle 1 M ${formatTl(yangUnitPrice)} TL yerine ${formatTl(yangDiscountedUnitPrice)} TL. İndirimsiz toplam ${formatTl(yangOriginalTotal)} TL, indirimli toplam ${formatTl(yangTotal)} TL.` : ` 1 M fiyatı ${formatTl(yangUnitPrice)} TL, hesaplanan toplam ${formatTl(yangTotal)} TL.`;
    const message = encodeURIComponent(`Merhaba Haswolf, ${product.server} sunucusundan ${amountLabel} Yang almak istiyorum.${discountText}`);
    window.open(`https://wa.me/905010942080?text=${message}`, "_blank", "noopener,noreferrer");
  }

  function buyFlexibleDc() {
    if (!isDcReference || !dcPlan || numericDcAmount < 100 || rawDcAmount > MAX_DC) return;
    const planText = dcPlan.map(formatDcPackage).join(" + ");
    const giftText = dcGiftAmount > 0 ? ` ${dcPaidAmount.toLocaleString("tr-TR")} DC satın alımına ${dcGiftAmount.toLocaleString("tr-TR")} DC bizden hediye; toplam ${dcDeliveredAmount.toLocaleString("tr-TR")} DC teslim edilir.` : ` Toplam ${dcDeliveredAmount.toLocaleString("tr-TR")} DC teslim edilir.`;
    const message = encodeURIComponent(`Merhaba Haswolf, ${product.server} sunucusundan ${dcPaidAmount.toLocaleString("tr-TR")} Dragon Coin (DC) satın almak istiyorum. Paket planı: ${planText}.${giftText} Hesaplanan toplam ${formatTl(dcTotalM)} M.`);
    window.open(`https://wa.me/905010942080?text=${message}`, "_blank", "noopener,noreferrer");
  }

  if (product.category === "yang" && !isYangReference) return <><span className="haswolf-yang-suppress" aria-hidden="true" /><style jsx global>{`.haswolf-yang-card:has(.haswolf-yang-suppress){display:none!important;}`}</style></>;
  if (product.category === "dc" && !isDcReference) return <><span className="haswolf-dc-suppress" aria-hidden="true" /><style jsx global>{`.haswolf-dc-card:has(.haswolf-dc-suppress){display:none!important;}`}</style></>;

  if (isYangReference) {
    const invalidHigh = rawYangAmount > MAX_YANG_M;
    const campaignText = numericYangAmount >= 2000
      ? "2 T ve üzeri alımlarda maksimum indirim: 1 M başına 0,50 TL. 5 T, 10 T veya daha yüksek alımlarda da bu indirim seviyesi korunur."
      : numericYangAmount >= 1000
        ? "1 T ve üzeri alımlarda 1 M başına 0,25 TL anında indirim. 2 T'ye ulaştığında indirim 0,50 TL/M seviyesine çıkar."
        : "1 T ve üzeri alımlarda 1 M başına 0,25 TL indirim başlar. 2 T ve üzerindeki alımlarda indirim 0,50 TL/M seviyesine çıkar ve daha yüksek miktarlarda korunur.";
    return (
      <div className="haswolf-yang-flexible-calculator">
        <div className="haswolf-yang-flexible-calculator__heading"><div><strong>İstediğin miktarı yaz</strong><span>{hasYangDiscount ? <><s>1 M = {formatTl(yangUnitPrice)} TL</s><b className="haswolf-yang-sale-unit">1 M = {formatTl(yangDiscountedUnitPrice)} TL</b></> : <>1 M = {formatTl(yangUnitPrice)} TL</>}</span></div><b>{product.server}</b></div>
        <label><span>Yang miktarı (M)</span><div><input type="number" min="1" max={MAX_YANG_M} step="1" inputMode="numeric" value={yangAmount} onChange={(event) => setYangAmount(event.target.value)} onBlur={() => { if (rawYangAmount > MAX_YANG_M) setYangAmount(String(MAX_YANG_M)); }} placeholder="Örn. 558" /><em>{numericYangAmount >= 1000 ? `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 }).format(numericYangAmount / 1000)} T` : "M"}</em></div></label>
        {invalidHigh && <div className="haswolf-yang-limit-warning">En fazla 20.000 M (20 T) satın alabilirsin.</div>}
        <div className="haswolf-yang-campaign"><strong>⚡ TOPLU ALIM AVANTAJI</strong><span>{campaignText}</span></div>
        <div className="haswolf-yang-flexible-calculator__total"><span>Hesaplanan toplam</span><strong>{numericYangAmount >= 1 ? <>{hasYangDiscount && <s>{formatTl(yangOriginalTotal)} TL</s>}<b>{formatTl(yangTotal)} TL</b></> : "—"}</strong></div>
        <p>1–20.000 M arasında istediğin miktarı yazabilirsin. 1.000 M = 1 T. <b>Toplu alım indirimi tüm sunucularda otomatik uygulanır.</b></p>
        <button type="button" onClick={buyFlexibleYang} disabled={numericYangAmount < 1 || invalidHigh}>WhatsApp ile {numericYangAmount >= 1 ? formatYangAmount(numericYangAmount) : "Yang"} Satın Al</button>
        <style jsx global>{`
          .haswolf-yang-card:has(.haswolf-yang-flexible-calculator) .haswolf-yang-card__title-row,.haswolf-yang-card:has(.haswolf-yang-flexible-calculator) .haswolf-yang-card__description,.haswolf-yang-card:has(.haswolf-yang-flexible-calculator)>.haswolf-yang-card__content>.haswolf-yang-card__meta{display:none!important}.haswolf-yang-card:has(.haswolf-yang-flexible-calculator) .haswolf-yang-card__media{min-height:92px}.haswolf-yang-flexible-calculator{margin-top:8px;display:grid;gap:12px}.haswolf-yang-flexible-calculator__heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.haswolf-yang-flexible-calculator__heading strong{display:block;font-size:16px;color:#f2ca68}.haswolf-yang-flexible-calculator__heading span{display:block;margin-top:3px;font-size:12px;color:#a1a1aa}.haswolf-yang-flexible-calculator__heading span s{opacity:.65;margin-right:8px}.haswolf-yang-sale-unit{display:inline!important;color:#4ade80!important;font-size:12px!important}.haswolf-yang-flexible-calculator__heading>b{font-size:11px;color:var(--server-color,#d9aa4a)}.haswolf-yang-flexible-calculator label>span{display:block;margin-bottom:6px;font-size:12px;color:#d4d4d8}.haswolf-yang-flexible-calculator label>div{display:flex;align-items:center;overflow:hidden;border:1px solid rgba(217,170,74,.45);border-radius:10px;background:#050606}.haswolf-yang-flexible-calculator input{min-width:0;flex:1;border:0;outline:0;background:transparent;padding:12px 14px;color:white;font-size:18px;font-weight:800}.haswolf-yang-flexible-calculator label em{min-width:62px;padding:0 12px;text-align:center;color:#e7b74f;font-style:normal;font-weight:900}.haswolf-yang-limit-warning{border:1px solid rgba(239,68,68,.45);border-radius:8px;background:rgba(127,29,29,.18);padding:8px 10px;color:#fca5a5;font-size:11px;font-weight:700}.haswolf-yang-campaign{border:1px solid rgba(74,222,128,.42);border-radius:10px;background:linear-gradient(135deg,rgba(20,83,45,.28),rgba(217,170,74,.08));padding:10px 12px;box-shadow:0 0 20px rgba(34,197,94,.06)}.haswolf-yang-campaign strong{display:block;color:#4ade80;font-size:12px;letter-spacing:.06em}.haswolf-yang-campaign span{display:block;margin-top:4px;color:#d4d4d8;font-size:11px;line-height:1.45}.haswolf-yang-flexible-calculator__total{display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);padding:11px 13px}.haswolf-yang-flexible-calculator__total span{color:#a1a1aa;font-size:12px}.haswolf-yang-flexible-calculator__total strong{display:flex;align-items:center;gap:9px;color:#f3c95f;font-size:17px;text-align:right}.haswolf-yang-flexible-calculator__total strong s{color:#71717a;font-size:13px;font-weight:600}.haswolf-yang-flexible-calculator__total strong b{color:#4ade80}.haswolf-yang-flexible-calculator p{margin:0;color:#71717a;font-size:11px}.haswolf-yang-flexible-calculator p b{color:#d9aa4a}.haswolf-yang-flexible-calculator>button{width:100%;border:1px solid rgba(74,222,128,.5);border-radius:10px;background:linear-gradient(#15803d,#14532d);padding:12px 14px;color:white;font-size:13px;font-weight:800;overflow-wrap:anywhere}.haswolf-yang-flexible-calculator>button:disabled{opacity:.45;cursor:not-allowed}
        `}</style>
      </div>
    );
  }

  if (isDcReference) {
    const invalidHigh = rawDcAmount > MAX_DC; const planText = dcPlan?.map(formatDcPackage).join(" + ") ?? "";
    return (
      <div className="haswolf-dc-flexible-calculator">
        <div className="haswolf-dc-flexible-calculator__heading"><div><strong>İstediğin Dragon Coin (DC) miktarını yaz</strong><span>100 Dragon Coin (DC) = {formatTl(product.price)} M</span></div><b>{product.server}</b></div>
        <label><span>Dragon Coin (DC) miktarı</span><div><input type="number" min="100" max={MAX_DC} step="1" inputMode="numeric" value={dcAmount} onChange={(event) => setDcAmount(event.target.value)} onBlur={() => { if (rawDcAmount > MAX_DC) setDcAmount(String(MAX_DC)); }} placeholder="Örn. 400" /><em>DC</em></div></label>
        {invalidHigh && <div className="haswolf-dc-warning">En fazla {MAX_DC.toLocaleString("tr-TR")} Dragon Coin (DC) hesaplanabilir.</div>}
        {dcPlan ? <div className="haswolf-dc-plan"><span>Oyun paketlerine bölünüşü</span><strong>{planText} Dragon Coin (DC)</strong></div> : numericDcAmount >= 100 ? <div className="haswolf-dc-warning">Bu miktar mevcut oyun paketleriyle tam oluşturulamıyor.{dcNearest.lower || dcNearest.upper ? <> En yakın seçenekler: {dcNearest.lower ? <button type="button" onClick={() => setDcAmount(String(dcNearest.lower))}>{dcNearest.lower} Dragon Coin (DC)</button> : null}{dcNearest.upper ? <button type="button" onClick={() => setDcAmount(String(dcNearest.upper))}>{dcNearest.upper} Dragon Coin (DC)</button> : null}</> : null}</div> : null}
        {dcPlan && dcGiftAmount > 0 ? <div className="haswolf-dc-gift"><span>Satın alınan</span><strong>{dcPaidAmount.toLocaleString("tr-TR")} DC</strong><em>+ {dcGiftAmount.toLocaleString("tr-TR")} DC BİZDEN HEDİYE · TOPLAM {dcDeliveredAmount.toLocaleString("tr-TR")} DC TESLİM</em></div> : null}
        <div className="haswolf-dc-flexible-calculator__total"><span>Hesaplanan toplam</span><strong>{dcPlan ? `${formatTl(dcTotalM)} M` : "—"}</strong></div>
        <p>Kullanılabilen oyun paketleri: {DC_PACKAGES.slice().sort((a,b)=>getDcPaidAmount(a)-getDcPaidAmount(b)).map(formatDcPackage).join(" · ")} Dragon Coin (DC). HEDİYE yazan Dragon Coin'ler fiyata dahil edilmez; yalnızca satın alınan miktar üzerinden M hesabı yapılır.</p>
        <button type="button" onClick={buyFlexibleDc} disabled={!dcPlan || numericDcAmount < 100 || invalidHigh}>WhatsApp ile {dcPlan ? `${dcPaidAmount.toLocaleString("tr-TR")} Dragon Coin (DC)` : "Dragon Coin (DC)"} Satın Al</button>
        <style jsx global>{`
          .haswolf-dc-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__title-row,.haswolf-dc-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__description{display:none!important}.haswolf-dc-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__meta button{display:none!important}.haswolf-dc-card:has(.haswolf-dc-flexible-calculator) .haswolf-dc-card__title-row,.haswolf-dc-card:has(.haswolf-dc-flexible-calculator) .haswolf-dc-card__description,.haswolf-dc-card:has(.haswolf-dc-flexible-calculator)>.haswolf-dc-card__content>.haswolf-dc-card__meta{display:none!important}.haswolf-dc-card:has(.haswolf-dc-flexible-calculator) .haswolf-dc-card__media{min-height:92px}.haswolf-dc-flexible-calculator{margin-top:8px;display:grid;gap:12px}.haswolf-dc-flexible-calculator__heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.haswolf-dc-flexible-calculator__heading strong{display:block;font-size:16px;color:#70b7ff}.haswolf-dc-flexible-calculator__heading span{display:block;margin-top:3px;font-size:12px;color:#a1a1aa}.haswolf-dc-flexible-calculator__heading b{font-size:11px;color:var(--server-color,#70b7ff)}.haswolf-dc-flexible-calculator label>span{display:block;margin-bottom:6px;font-size:12px;color:#d4d4d8}.haswolf-dc-flexible-calculator label>div{display:flex;align-items:center;overflow:hidden;border:1px solid rgba(75,145,255,.5);border-radius:10px;background:#05080b}.haswolf-dc-flexible-calculator input{min-width:0;flex:1;border:0;outline:0;background:transparent;padding:12px 14px;color:white;font-size:18px;font-weight:800}.haswolf-dc-flexible-calculator label em{min-width:62px;padding:0 12px;text-align:center;color:#70b7ff;font-style:normal;font-weight:900}.haswolf-dc-plan{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(75,145,255,.25);border-radius:10px;background:rgba(35,90,160,.10);padding:10px 12px}.haswolf-dc-plan span{font-size:11px;color:#9ca3af}.haswolf-dc-plan strong{font-size:13px;color:#9ed0ff;text-align:right}.haswolf-dc-gift{display:grid;grid-template-columns:1fr auto;gap:3px 10px;border:1px solid rgba(34,197,94,.32);border-radius:10px;background:rgba(20,83,45,.14);padding:9px 12px}.haswolf-dc-gift span{font-size:11px;color:#9ca3af}.haswolf-dc-gift strong{font-size:13px;color:#dbeafe}.haswolf-dc-gift em{grid-column:1/-1;color:#4ade80;font-style:normal;font-size:12px;font-weight:900}.haswolf-dc-warning{border:1px solid rgba(245,158,11,.38);border-radius:8px;background:rgba(120,72,5,.16);padding:9px 10px;color:#f7cf7a;font-size:11px;font-weight:700}.haswolf-dc-warning button{margin-left:7px;border:1px solid rgba(112,183,255,.4);border-radius:7px;background:rgba(24,78,136,.25);padding:4px 7px;color:#b9dcff;font-weight:800}.haswolf-dc-flexible-calculator__total{display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);padding:11px 13px}.haswolf-dc-flexible-calculator__total span{color:#a1a1aa;font-size:12px}.haswolf-dc-flexible-calculator__total strong{color:#8cc8ff;font-size:17px;text-align:right}.haswolf-dc-flexible-calculator p{margin:0;color:#71717a;font-size:10px;line-height:1.55}.haswolf-dc-flexible-calculator>button{width:100%;border:1px solid rgba(96,165,250,.48);border-radius:10px;background:linear-gradient(#2563a8,#153e68);padding:12px 14px;color:white;font-size:13px;font-weight:800}.haswolf-dc-flexible-calculator>button:disabled{opacity:.45;cursor:not-allowed}
        `}</style>
      </div>
    );
  }

  const stockLabel = product.stock <= 2 || product.low_stock_alert ? `Stok azalıyor · ${product.stock}` : `Stok ${product.stock}`;
  return <div className={compact ? "haswolf-product-xp is-compact" : "haswolf-product-xp"}>{(product.is_daily_favorite || product.is_best_price) && <div className="haswolf-product-badges">{product.is_daily_favorite && <b>⭐ BUGÜNÜN FAVORİSİ</b>}{product.is_best_price && <b>🏆 EN UYGUN FİYAT</b>}</div>}<div className="haswolf-product-xp__meta"><span>Görüntülenme: {views.toLocaleString("tr-TR")}</span><span>Favorileyen: {favoriteCount.toLocaleString("tr-TR")}</span><span>Teslimat: {product.delivery_time || "1 saat"}</span><span className={product.stock <= 2 || product.low_stock_alert ? "is-low-stock" : ""}>{stockLabel}</span></div><div className="haswolf-product-xp__actions"><button type="button" className={favorite ? "is-active" : ""} onClick={toggleFavorite}>{favorite ? "Favoride" : "Favoriye Ekle"}</button><button type="button" className={compared ? "is-active" : ""} onClick={toggleCompare}>Karşılaştır</button><button type="button" onClick={shareProduct}>Paylaş</button></div></div>;
}
