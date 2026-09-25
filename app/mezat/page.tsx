"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Auction = {
  id: string;
  product_id: number;
  title: string;
  description: string | null;
  server: "EPHESUS" | "PERGAMON" | "TEOS";
  start_price: number;
  current_price: number;
  min_increment: number;
  starts_at: string;
  ends_at: string;
  extension_seconds: number;
  status: "scheduled" | "active" | "ended" | "cancelled";
};

type Product = {
  id: number;
  name: string;
  image_url: string | null;
  category: string;
  item_category: string | null;
};

type Bid = {
  id: string;
  auction_id: string;
  bidder_name: string;
  amount: number;
  created_at: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(Number(value));

function maskName(name: string) {
  const clean = name?.trim() || "Oyuncu";
  if (clean.length <= 3) return clean[0] + "***";
  return clean.slice(0, 2) + "***" + clean.slice(-1);
}

function Countdown({ endsAt, status }: { endsAt: string; status: Auction["status"] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (status === "ended") return <span className="text-zinc-500">SONA ERDİ</span>;

  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return (
    <span className={total <= 60 ? "text-red-300 animate-pulse" : "text-[#f0c66d]"}>
      {h > 0 ? `${String(h).padStart(2, "0")}:` : ""}
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function MezatPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [bidInput, setBidInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "scheduled" | "ended">("active");

  const load = useCallback(async () => {
    setLoading(true);
    await supabase.rpc("sync_auction_statuses");
    const { data: auctionData } = await supabase
      .from("auctions")
      .select("*")
      .order("ends_at", { ascending: true });

    const list = (auctionData ?? []) as Auction[];
    setAuctions(list);

    const productIds = [...new Set(list.map((a) => a.product_id))];
    if (productIds.length) {
      const { data: productData } = await supabase
        .from("products")
        .select("id,name,image_url,category,item_category")
        .in("id", productIds);
      setProducts((productData ?? []) as Product[]);
    } else {
      setProducts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("haswolf-mezat-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "auction_bids" }, (payload) => {
        const bid = payload.new as Bid;
        setBids((current) => ({
          ...current,
          [bid.auction_id]: [bid, ...(current[bid.auction_id] ?? [])].slice(0, 8),
        }));
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const loadBids = useCallback(async (auctionId: string) => {
    const { data } = await supabase
      .from("auction_bids")
      .select("id,auction_id,bidder_name,amount,created_at")
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: false })
      .limit(8);
    setBids((current) => ({ ...current, [auctionId]: (data ?? []) as Bid[] }));
  }, []);

  useEffect(() => {
    if (selected) loadBids(selected);
  }, [selected, loadBids]);

  const filtered = useMemo(
    () => auctions.filter((auction) => filter === "all" || auction.status === filter),
    [auctions, filter],
  );

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selectedAuction = auctions.find((a) => a.id === selected) ?? null;

  async function placeBid(auction: Auction) {
    setMessage("");
    const amount = Number(bidInput);
    if (!Number.isFinite(amount) || amount <= auction.current_price) {
      setMessage(`Teklif en az ${money(auction.current_price + auction.min_increment)} TL olmalı.`);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage("Teklif vermek için giriş yapmalısın.");
      return;
    }

    setBidLoading(true);
    const response = await fetch("/api/mezat/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ auctionId: auction.id, amount }),
    });
    const result = await response.json();
    setBidLoading(false);

    if (!response.ok) {
      setMessage(result.error || "Teklif verilemedi.");
      return;
    }

    setMessage("🔔 Teklifin başarıyla alındı!");
    setBidInput("");
    await load();
    await loadBids(auction.id);
  }

  const activeCount = auctions.filter((a) => a.status === "active").length;

  return (
    <main className="min-h-screen bg-[#050707] text-white">
      <header className="sticky top-0 z-40 border-b border-[#8c641e]/40 bg-black/95 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-xl font-black tracking-[0.18em] text-[#d9aa4a] sm:text-2xl">HASWOLF</Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
              🔴 {activeCount} CANLI
            </span>
            <Link href="/" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-[#d9aa4a]/50 hover:text-white">Pazar</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_70%_20%,rgba(217,170,74,.18),transparent_34%),linear-gradient(135deg,#050505,#0e0b05)]">
        <div className="mx-auto max-w-[1500px] px-4 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-[#d9aa4a]">HASWOLF MARKET</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">🐺 Mezat Merkezi</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              Canlı teklifler, son saniye uzatma ve gerçek zamanlı teklif akışıyla oyun içi eşyalar için profesyonel müzayede salonu.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {([
            ["active", "🔴 Canlı"],
            ["scheduled", "⏳ Yaklaşıyor"],
            ["ended", "🏁 Sona Eren"],
            ["all", "Tümü"],
          ] as const).map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${filter === value ? "border-[#d9aa4a] bg-[#d9aa4a]/15 text-[#f0c66d]" : "border-white/10 text-zinc-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-12 text-center text-zinc-500">Mezatlar yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-12 text-center">
            <div className="text-5xl">🏛️</div>
            <h2 className="mt-4 text-xl font-black">Bu bölümde henüz mezat yok</h2>
            <p className="mt-2 text-sm text-zinc-500">Admin panelinden ilk mezatı oluşturabilirsin.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((auction) => {
              const product = productMap.get(auction.product_id);
              const auctionBids = bids[auction.id] ?? [];
              const isSelected = selected === auction.id;
              const minBid = Math.max(auction.start_price, auction.current_price + auction.min_increment);

              return (
                <article key={auction.id} className={`overflow-hidden rounded-2xl border bg-[#0b0d0d] shadow-2xl transition ${isSelected ? "border-[#d9aa4a]/70 ring-1 ring-[#d9aa4a]/20" : "border-white/10 hover:border-[#d9aa4a]/35"}`}>
                  <div className="relative aspect-[16/10] overflow-hidden bg-black">
                    {product?.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-6" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-7xl">🐺</div>
                    )}
                    <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/75 px-3 py-1 text-xs font-black">{auction.server}</div>
                    <div className="absolute right-3 top-3 rounded-full border border-[#d9aa4a]/30 bg-black/75 px-3 py-1 text-xs font-bold text-[#f0c66d]">LOT #{auction.id.slice(0,6).toUpperCase()}</div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-black">{auction.title}</h2>
                        <p className="mt-1 text-xs text-zinc-500">{product?.name}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${auction.status === "active" ? "bg-red-500/10 text-red-300" : auction.status === "scheduled" ? "bg-amber-500/10 text-amber-300" : "bg-white/5 text-zinc-500"}`}>
                        {auction.status === "active" ? "CANLI" : auction.status === "scheduled" ? "YAKLAŞIYOR" : "SONA ERDİ"}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Güncel Teklif</span>
                        <strong className="mt-1 block text-xl font-black text-[#f0c66d]">{money(auction.current_price)} TL</strong>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Kalan Süre</span>
                        <strong className="mt-1 block text-xl font-black"><Countdown endsAt={auction.ends_at} status={auction.status} /></strong>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span>Minimum artış: {money(auction.min_increment)} TL</span>
                      <span>{auctionBids.length ? `${auctionBids.length}+ teklif` : "Henüz teklif yok"}</span>
                    </div>

                    {isSelected && auction.status === "active" ? (
                      <div className="mt-4 rounded-xl border border-[#d9aa4a]/20 bg-[#d9aa4a]/5 p-3">
                        <div className="flex gap-2">
                          <input value={bidInput} onChange={(e) => setBidInput(e.target.value)} type="number" min={minBid} step={auction.min_increment} placeholder={money(minBid)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-3 text-sm outline-none focus:border-[#d9aa4a]" />
                          <button disabled={bidLoading} onClick={() => placeBid(auction)} className="rounded-lg bg-gradient-to-b from-[#ffe083] to-[#b87514] px-4 py-3 text-sm font-black text-black disabled:opacity-50">
                            {bidLoading ? "..." : "TEKLİF VER"}
                          </button>
                        </div>
                        {message && <p className="mt-2 text-xs text-[#f0c66d]">{message}</p>}
                      </div>
                    ) : (
                      <button onClick={() => { setSelected(isSelected ? null : auction.id); setMessage(""); }} className="mt-4 w-full rounded-xl border border-[#d9aa4a]/35 bg-[#d9aa4a]/10 py-3 text-sm font-black text-[#f0c66d] hover:bg-[#d9aa4a]/15">
                        {auction.status === "active" ? "MEZATA KATIL" : "DETAYLARI GÖR"}
                      </button>
                    )}

                    {isSelected && auctionBids.length > 0 && (
                      <div className="mt-4 border-t border-white/5 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Canlı Teklifler</span>
                          <span className="text-[10px] text-zinc-600">Son 8</span>
                        </div>
                        <div className="space-y-1.5">
                          {auctionBids.map((bid) => (
                            <div key={bid.id} className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 text-xs">
                              <span className="text-zinc-400">{maskName(bid.bidder_name)}</span>
                              <strong className="text-[#f0c66d]">{money(bid.amount)} TL</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
