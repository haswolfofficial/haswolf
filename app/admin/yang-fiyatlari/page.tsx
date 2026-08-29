"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../../../components/AdminNav";
import { supabase } from "../../../lib/supabase";
import { hasAdminAccess } from "../../../lib/admin-access";

type YangProduct = {
  id: number;
  name: string;
  server: "EPHESUS" | "PERGAMON" | "TEOS";
  price: number;
  is_active: boolean;
};

const SERVERS = ["EPHESUS", "PERGAMON", "TEOS"] as const;

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

function formatUnitPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

export default function YangUnitPricesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<YangProduct[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const references = useMemo(() => {
    return Object.fromEntries(
      SERVERS.map((server) => {
        const candidates = products
          .filter((product) => product.server === server)
          .map((product) => ({ product, amount: getReferenceAmount(product.name) }))
          .filter((entry) => entry.amount >= 1000)
          .sort((a, b) => {
            if (a.product.is_active !== b.product.is_active) return a.product.is_active ? -1 : 1;
            return Math.abs(a.amount - 1000) - Math.abs(b.amount - 1000);
          });
        return [server, candidates[0] ?? null];
      }),
    ) as Record<(typeof SERVERS)[number], { product: YangProduct; amount: number } | null>;
  }, [products]);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,server,price,is_active")
      .eq("category", "yang");

    if (error) throw error;
    const loaded = (data ?? []) as YangProduct[];
    setProducts(loaded);

    const next: Record<string, string> = {};
    for (const server of SERVERS) {
      const candidates = loaded
        .filter((product) => product.server === server)
        .map((product) => ({ product, amount: getReferenceAmount(product.name) }))
        .filter((entry) => entry.amount >= 1000)
        .sort((a, b) => {
          if (a.product.is_active !== b.product.is_active) return a.product.is_active ? -1 : 1;
          return Math.abs(a.amount - 1000) - Math.abs(b.amount - 1000);
        });
      const reference = candidates[0];
      if (reference) next[server] = String(reference.product.price / reference.amount);
    }
    setInputs(next);
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/admin-login");
        return;
      }
      if (!(await hasAdminAccess(data.session.user))) {
        setMessage("Bu sayfaya yalnızca yetkili yönetici hesapları erişebilir.");
        setLoading(false);
        return;
      }
      setAuthorized(true);
      try {
        await loadProducts();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Yang fiyatları yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [router]);

  async function saveServer(server: (typeof SERVERS)[number]) {
    const reference = references[server];
    if (!reference) {
      setMessage(`${server} için en az 1000 M referans Yang ilanı bulunamadı.`);
      return;
    }

    const unitPrice = Number((inputs[server] || "").replace(",", "."));
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setMessage(`${server} için geçerli bir 1 M fiyatı gir.`);
      return;
    }

    const totalReferencePrice = Number((unitPrice * reference.amount).toFixed(2));
    setSaving(server);
    setMessage("");

    const { error } = await supabase
      .from("products")
      .update({ price: totalReferencePrice })
      .eq("id", reference.product.id);

    if (error) {
      setMessage(error.message);
      setSaving(null);
      return;
    }

    setMessage(`${server}: 1 M = ${formatUnitPrice(unitPrice)} TL olarak güncellendi.`);
    await loadProducts();
    setSaving(null);
  }

  if (loading) {
    return <main className="min-h-screen bg-[#050707] p-8 text-white">Kontrol ediliyor...</main>;
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#050707] p-8 text-white">
        <div className="mx-auto max-w-xl rounded-xl border border-red-500/40 bg-red-950/20 p-6">{message}</div>
      </main>
    );
  }

  return (
    <main className="haswolf-admin-v5">
      <AdminNav />
      <section className="haswolf-admin-v5__content">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#d9aa4a]">Yang Birim Fiyatları</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Her sunucu için yalnızca 1 M satış fiyatını belirle. Müşteri 29 M, 558 M veya istediği başka miktarı yazdığında toplam tutar otomatik hesaplanır.
            </p>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-[#765625]/50 bg-black/40 px-4 py-3 text-sm text-[#e8bd67]">{message}</div>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {SERVERS.map((server) => {
              const reference = references[server];
              return (
                <article key={server} className="rounded-2xl border border-[#765625]/50 bg-[#0b0d0d] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[.2em] text-zinc-500">Sunucu</p>
                      <h2 className="mt-1 text-xl font-black text-[#e3b653]">{server}</h2>
                    </div>
                    <span className={reference?.product.is_active ? "text-xs text-emerald-400" : "text-xs text-zinc-500"}>
                      {reference ? (reference.product.is_active ? "Yayında" : "Pasif") : "Referans yok"}
                    </span>
                  </div>

                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-300">1 M fiyatı (TL)</span>
                    <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-black">
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={inputs[server] ?? ""}
                        onChange={(event) => setInputs((current) => ({ ...current, [server]: event.target.value }))}
                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg font-bold outline-none"
                        placeholder="Örn. 9.50"
                      />
                      <span className="px-4 text-sm font-bold text-[#e3b653]">TL</span>
                    </div>
                  </label>

                  {reference ? (
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      Referans: {reference.product.name} · {reference.amount.toLocaleString("tr-TR")} M. Sistem arka planda bu ilanın toplam fiyatını günceller.
                    </p>
                  ) : (
                    <p className="mt-3 text-xs leading-5 text-red-300">Bu sunucuda 1000 M veya 1 T referans ilanı bulunamadı.</p>
                  )}

                  <button
                    type="button"
                    onClick={() => saveServer(server)}
                    disabled={!reference || saving === server}
                    className="mt-5 w-full rounded-xl bg-[#d1a13d] px-4 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving === server ? "Kaydediliyor..." : "1 M Fiyatını Kaydet"}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="mt-7 rounded-xl border border-blue-500/20 bg-blue-950/10 p-5 text-sm leading-6 text-zinc-400">
            Örnek: 1 M fiyatını 9,50 TL yaparsan 558 M için sistem otomatik 5.301 TL hesaplar ve WhatsApp mesajına miktar ile hesaplanan toplamı ekler.
          </div>
        </div>
      </section>
    </main>
  );
}
