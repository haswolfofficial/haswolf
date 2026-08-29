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
type ServerName = (typeof SERVERS)[number];

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

  const yangRefs = useMemo(() => Object.fromEntries(SERVERS.map((server) => [
    server,
    products.find((p) => p.category === "yang" && p.server === server) ?? null,
  ])) as Record<ServerName, MarketProduct | null>, [products]);

  const dcRefs = useMemo(() => Object.fromEntries(SERVERS.map((server) => [
    server,
    products.find((p) => p.category === "dc" && p.server === server) ?? null,
  ])) as Record<ServerName, MarketProduct | null>, [products]);

  async function callApi(method: "GET" | "POST", body?: unknown) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Yönetici oturumu bulunamadı.");

    const response = await fetch("/api/admin/market-prices", {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Fiyat işlemi başarısız.");
    return result as { products: MarketProduct[] };
  }

  function applyProducts(loaded: MarketProduct[]) {
    setProducts(loaded);
    const nextYang: Record<string, string> = {};
    const nextDc: Record<string, string> = {};
    for (const server of SERVERS) {
      const y = loaded.find((p) => p.category === "yang" && p.server === server);
      const d = loaded.find((p) => p.category === "dc" && p.server === server);
      if (y) nextYang[server] = String(Number(y.price) / 1000);
      if (d) nextDc[server] = String(Number(d.price));
    }
    setYangInputs(nextYang);
    setDcInputs(nextDc);
  }

  async function refresh() {
    const result = await callApi("GET");
    applyProducts(result.products);
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/admin-login"); return; }
      if (!(await hasAdminAccess(data.session.user))) {
        setMessage("Bu sayfaya yalnızca yetkili yönetici hesapları erişebilir.");
        setLoading(false);
        return;
      }
      setAuthorized(true);
      try {
        await refresh();
        setMessage("3 Yang ve 3 DC sunucu kaydı hazır. Fiyatları aşağıdan değiştirebilirsin.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Fiyat kayıtları hazırlanamadı.");
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [router]);

  async function savePrice(category: "yang" | "dc", server: ServerName) {
    const source = category === "yang" ? yangInputs : dcInputs;
    const value = Number((source[server] || "").replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setMessage(`${server} için geçerli bir fiyat gir.`);
      return;
    }

    setSaving(`${category}-${server}`);
    setMessage("");
    try {
      const result = await callApi("POST", { category, server, value });
      applyProducts(result.products);
      setMessage(category === "yang"
        ? `${server}: 1 M = ${formatNumber(value)} TL olarak güncellendi.`
        : `${server}: 100 DC = ${formatNumber(value)} M olarak güncellendi.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fiyat güncellenemedi.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <main className="min-h-screen bg-[#050707] p-8 text-white">Kontrol ediliyor...</main>;
  if (!authorized) return <main className="min-h-screen bg-[#050707] p-8 text-white"><div className="mx-auto max-w-xl rounded-xl border border-red-500/40 bg-red-950/20 p-6">{message}</div></main>;

  return (
    <main className="haswolf-admin-v5">
      <AdminNav />
      <section className="haswolf-admin-v5__content">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#d9aa4a]">Yang ve DC Fiyatları</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Her sunucu için tek fiyat gir. Yang: 1 M kaç TL. DC: 100 DC kaç M.</p>
          </div>

          {message && <div className="mb-6 rounded-xl border border-[#765625]/50 bg-black/40 px-4 py-3 text-sm text-[#e8bd67]">{message}</div>}

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-black text-[#e3b653]">Yang · 1 M Fiyatı (TL)</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {SERVERS.map((server) => {
                const ref = yangRefs[server];
                return (
                  <article key={server} className="rounded-2xl border border-[#765625]/50 bg-[#0b0d0d] p-5">
                    <div className="flex justify-between gap-3">
                      <div><p className="text-xs uppercase tracking-[.2em] text-zinc-500">Sunucu</p><h3 className="mt-1 text-xl font-black text-[#e3b653]">{server}</h3></div>
                      <span className={ref?.is_active ? "text-xs text-emerald-400" : "text-xs text-red-400"}>{ref?.is_active ? "Yayında" : "Eksik"}</span>
                    </div>
                    <label className="mt-5 block">
                      <span className="mb-2 block text-sm text-zinc-300">1 M fiyatı</span>
                      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black">
                        <input type="number" min="0.01" step="0.01" value={yangInputs[server] ?? ""} onChange={(e)=>setYangInputs((c)=>({...c,[server]:e.target.value}))} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg font-bold outline-none" />
                        <span className="px-4 py-3 font-bold text-[#e3b653]">TL</span>
                      </div>
                    </label>
                    <button type="button" onClick={()=>savePrice("yang", server)} disabled={!ref || saving===`yang-${server}`} className="mt-5 w-full rounded-xl bg-[#d1a13d] px-4 py-3 font-black text-black disabled:opacity-40">{saving===`yang-${server}`?"Kaydediliyor...":"Kaydet"}</button>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-black text-blue-300">DC · 100 DC Fiyatı (M)</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {SERVERS.map((server) => {
                const ref = dcRefs[server];
                return (
                  <article key={server} className="rounded-2xl border border-blue-500/30 bg-[#0b0d0d] p-5">
                    <div className="flex justify-between gap-3">
                      <div><p className="text-xs uppercase tracking-[.2em] text-zinc-500">Sunucu</p><h3 className="mt-1 text-xl font-black text-blue-300">{server}</h3></div>
                      <span className={ref?.is_active ? "text-xs text-emerald-400" : "text-xs text-red-400"}>{ref?.is_active ? "Yayında" : "Eksik"}</span>
                    </div>
                    <label className="mt-5 block">
                      <span className="mb-2 block text-sm text-zinc-300">100 DC karşılığı</span>
                      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black">
                        <input type="number" min="0.01" step="0.01" value={dcInputs[server] ?? ""} onChange={(e)=>setDcInputs((c)=>({...c,[server]:e.target.value}))} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg font-bold outline-none" />
                        <span className="px-4 py-3 font-bold text-blue-300">M</span>
                      </div>
                    </label>
                    <button type="button" onClick={()=>savePrice("dc", server)} disabled={!ref || saving===`dc-${server}`} className="mt-5 w-full rounded-xl bg-blue-400 px-4 py-3 font-black text-black disabled:opacity-40">{saving===`dc-${server}`?"Kaydediliyor...":"Kaydet"}</button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
