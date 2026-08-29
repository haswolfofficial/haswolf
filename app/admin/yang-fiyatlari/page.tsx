"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../../../components/AdminNav";
import { supabase } from "../../../lib/supabase";
import { hasAdminAccess } from "../../../lib/admin-access";

type MarketProduct = {
  id: number;
  name: string;
  category: "yang" | "dc";
  server: "EPHESUS" | "PERGAMON" | "TEOS";
  price: number;
  is_active: boolean;
};

const SERVERS = ["EPHESUS", "PERGAMON", "TEOS"] as const;
const DEFAULT_YANG_UNIT: Record<(typeof SERVERS)[number], number> = {
  EPHESUS: 9.5,
  PERGAMON: 9,
  TEOS: 8.75,
};
const DEFAULT_DC_PRICE: Record<(typeof SERVERS)[number], number> = {
  EPHESUS: 8,
  PERGAMON: 8.5,
  TEOS: 9,
};

function getReferenceAmount(name: string) {
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

export default function MarketPricePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [yangInputs, setYangInputs] = useState<Record<string, string>>({});
  const [dcInputs, setDcInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const yangRefs = useMemo(() => Object.fromEntries(SERVERS.map((server) => {
    const candidates = products.filter((p) => p.category === "yang" && p.server === server)
      .map((product) => ({ product, amount: getReferenceAmount(product.name) }))
      .filter((entry) => entry.amount >= 1000)
      .sort((a, b) => Number(b.product.is_active) - Number(a.product.is_active));
    return [server, candidates[0] ?? null];
  })) as Record<(typeof SERVERS)[number], { product: MarketProduct; amount: number } | null>, [products]);

  const dcRefs = useMemo(() => Object.fromEntries(SERVERS.map((server) => [
    server,
    products.find((p) => p.category === "dc" && p.server === server) ?? null,
  ])) as Record<(typeof SERVERS)[number], MarketProduct | null>, [products]);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,category,server,price,is_active")
      .in("category", ["yang", "dc"]);
    if (error) throw error;
    return (data ?? []) as MarketProduct[];
  }

  async function ensureDefaults(userId: string) {
    let current = await fetchProducts();

    for (const server of SERVERS) {
      const serverYang = current.filter((p) => p.category === "yang" && p.server === server);
      const validYang = serverYang.find((p) => getReferenceAmount(p.name) >= 1000);

      if (!validYang && serverYang.length > 0) {
        const chosen = serverYang.find((p) => p.is_active) ?? serverYang[0];
        const assumedUnit = chosen.price > 0 && chosen.price < 100 ? chosen.price : DEFAULT_YANG_UNIT[server];
        const { error } = await supabase.from("products").update({
          name: "1 T (1000 M)",
          price: Number((assumedUnit * 1000).toFixed(2)),
          stock: 1000000,
          is_active: true,
        }).eq("id", chosen.id);
        if (error) throw error;
      }

      if (serverYang.length === 0) {
        const { error } = await supabase.from("products").insert({
          name: "1 T (1000 M)", category: "yang", server,
          price: DEFAULT_YANG_UNIT[server] * 1000,
          stock: 1000000, is_active: true, created_by: userId,
          delivery_time: "1 saat",
        });
        if (error) throw error;
      }

      const serverDc = current.find((p) => p.category === "dc" && p.server === server);
      if (!serverDc) {
        const { error } = await supabase.from("products").insert({
          name: "100 DC", category: "dc", server,
          price: DEFAULT_DC_PRICE[server],
          stock: 1000000, is_active: true, created_by: userId,
          delivery_time: "1 saat",
        });
        if (error) throw error;
      }
    }
  }

  async function loadProducts() {
    const loaded = await fetchProducts();
    setProducts(loaded);
    const nextYang: Record<string, string> = {};
    const nextDc: Record<string, string> = {};
    for (const server of SERVERS) {
      const y = loaded.filter((p) => p.category === "yang" && p.server === server)
        .map((product) => ({ product, amount: getReferenceAmount(product.name) }))
        .find((entry) => entry.amount >= 1000);
      if (y) nextYang[server] = String(y.product.price / y.amount);
      const d = loaded.find((p) => p.category === "dc" && p.server === server);
      if (d) nextDc[server] = String(d.price);
    }
    setYangInputs(nextYang);
    setDcInputs(nextDc);
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/admin-login"); return; }
      if (!(await hasAdminAccess(data.session.user))) {
        setMessage("Bu sayfaya yalnızca yetkili yönetici hesapları erişebilir.");
        setLoading(false); return;
      }
      setAuthorized(true);
      try {
        await ensureDefaults(data.session.user.id);
        await loadProducts();
        setMessage("Eksik Yang ve DC kayıtları kontrol edildi. Üç sunucu da fiyat yönetimine hazır.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Fiyat kayıtları hazırlanamadı.");
      } finally { setLoading(false); }
    }
    void init();
  }, [router]);

  async function saveYang(server: (typeof SERVERS)[number]) {
    const reference = yangRefs[server];
    const unitPrice = Number((yangInputs[server] || "").replace(",", "."));
    if (!reference || !Number.isFinite(unitPrice) || unitPrice <= 0) { setMessage(`${server} için geçerli bir 1 M fiyatı gir.`); return; }
    setSaving(`yang-${server}`);
    const total = Number((unitPrice * reference.amount).toFixed(2));
    const { error } = await supabase.from("products").update({ price: total, is_active: true }).eq("id", reference.product.id);
    if (error) setMessage(error.message); else setMessage(`${server} Yang: 1 M = ${formatNumber(unitPrice)} TL olarak güncellendi.`);
    await loadProducts(); setSaving(null);
  }

  async function saveDc(server: (typeof SERVERS)[number]) {
    const reference = dcRefs[server];
    const value = Number((dcInputs[server] || "").replace(",", "."));
    if (!reference || !Number.isFinite(value) || value <= 0) { setMessage(`${server} için geçerli bir DC fiyatı gir.`); return; }
    setSaving(`dc-${server}`);
    const { error } = await supabase.from("products").update({ price: value, is_active: true }).eq("id", reference.id);
    if (error) setMessage(error.message); else setMessage(`${server}: 100 DC = ${formatNumber(value)} M olarak güncellendi.`);
    await loadProducts(); setSaving(null);
  }

  if (loading) return <main className="min-h-screen bg-[#050707] p-8 text-white">Kontrol ediliyor...</main>;
  if (!authorized) return <main className="min-h-screen bg-[#050707] p-8 text-white"><div className="mx-auto max-w-xl rounded-xl border border-red-500/40 bg-red-950/20 p-6">{message}</div></main>;

  return (
    <main className="haswolf-admin-v5">
      <AdminNav />
      <section className="haswolf-admin-v5__content">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8"><h1 className="text-3xl font-black text-[#d9aa4a]">Yang ve DC Fiyatları</h1><p className="mt-2 text-sm leading-6 text-zinc-400">Her sunucu için tek fiyat gir. Yang tarafında 1 M fiyatı, DC tarafında 100 DC karşılığı M değeri yönetilir.</p></div>
          {message && <div className="mb-6 rounded-xl border border-[#765625]/50 bg-black/40 px-4 py-3 text-sm text-[#e8bd67]">{message}</div>}

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-black text-[#e3b653]">Yang · 1 M Fiyatı (TL)</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {SERVERS.map((server) => {
                const ref = yangRefs[server];
                return <article key={server} className="rounded-2xl border border-[#765625]/50 bg-[#0b0d0d] p-5">
                  <div className="flex justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-zinc-500">Sunucu</p><h3 className="mt-1 text-xl font-black text-[#e3b653]">{server}</h3></div><span className="text-xs text-emerald-400">{ref?.product.is_active ? "Yayında" : "Hazır"}</span></div>
                  <label className="mt-5 block"><span className="mb-2 block text-sm text-zinc-300">1 M fiyatı</span><div className="flex overflow-hidden rounded-xl border border-white/10 bg-black"><input type="number" min="0.01" step="0.01" value={yangInputs[server] ?? ""} onChange={(e)=>setYangInputs((c)=>({...c,[server]:e.target.value}))} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg font-bold outline-none"/><span className="px-4 py-3 font-bold text-[#e3b653]">TL</span></div></label>
                  <button type="button" onClick={()=>saveYang(server)} disabled={!ref || saving===`yang-${server}`} className="mt-5 w-full rounded-xl bg-[#d1a13d] px-4 py-3 font-black text-black disabled:opacity-40">{saving===`yang-${server}`?"Kaydediliyor...":"Kaydet"}</button>
                </article>;
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-black text-blue-300">DC · 100 DC Fiyatı (M)</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {SERVERS.map((server) => {
                const ref = dcRefs[server];
                return <article key={server} className="rounded-2xl border border-blue-500/30 bg-[#0b0d0d] p-5">
                  <div className="flex justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-zinc-500">Sunucu</p><h3 className="mt-1 text-xl font-black text-blue-300">{server}</h3></div><span className="text-xs text-emerald-400">{ref?.is_active ? "Yayında" : "Hazır"}</span></div>
                  <label className="mt-5 block"><span className="mb-2 block text-sm text-zinc-300">100 DC karşılığı</span><div className="flex overflow-hidden rounded-xl border border-white/10 bg-black"><input type="number" min="0.01" step="0.01" value={dcInputs[server] ?? ""} onChange={(e)=>setDcInputs((c)=>({...c,[server]:e.target.value}))} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg font-bold outline-none"/><span className="px-4 py-3 font-bold text-blue-300">M</span></div></label>
                  <button type="button" onClick={()=>saveDc(server)} disabled={!ref || saving===`dc-${server}`} className="mt-5 w-full rounded-xl bg-blue-400 px-4 py-3 font-black text-black disabled:opacity-40">{saving===`dc-${server}`?"Kaydediliyor...":"Kaydet"}</button>
                </article>;
              })}
            </div>
          </section>

          <div className="mt-8 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-6 text-zinc-400">Başlangıç değerleri: Yang için EPHESUS 9,5 TL, PERGAMON 9 TL, TEOS 8,75 TL / 1 M. DC için EPHESUS 8 M, PERGAMON 8,5 M, TEOS 9 M / 100 DC. Bunların tamamını buradan istediğin zaman değiştirebilirsin.</div>
        </div>
      </section>
    </main>
  );
}
