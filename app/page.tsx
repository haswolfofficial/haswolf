"use client";

import AuthButton from "../components/AuthButton";
import MobileBottomNav from "../components/MobileBottomNav";
import SiteFooter from "../components/SiteFooter";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type MarketType = "item" | "yang" | "account";
type SortOption = "recommended" | "price-asc" | "price-desc" | "newest";

type Product = {
  id: number;
  name: string;
  category: MarketType;
  item_category: string | null;
  server: "EPHESUS" | "PERGAMON" | "TEOS";
  price: number;
  description: string | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at?: string;
};

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("tr-TR").format(price)} TL`;
}

function descriptionLines(description: string | null) {
  return (description ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const servers = [
  { name: "EPHESUS", color: "#45d66b" },
  { name: "PERGAMON", color: "#4d8fff" },
  { name: "TEOS", color: "#ff565f" },
];

const categories = [
  ["▦", "Tüm Ürünler"],
  ["⚔", "Silahlar"],
  ["🛡", "Kalkanlar"],
  ["♙", "Kolyeler"],
  ["♜", "Ayakkabılar"],
  ["◉", "Bilezikler"],
  ["♢", "Küpeler"],
  ["♚", "Zırhlar"],
  ["⛑", "Kasklar"],
  ["▣", "Diğer"],
];

function WolfLogo() {
  return (
    <a
      href="/"
      aria-label="HASWOLF ana sayfasına dön"
      className="flex items-center gap-3 sm:gap-4"
    >
      <div className="relative flex h-12 w-12 items-center justify-center sm:h-16 sm:w-16">
        <svg
          viewBox="0 0 120 120"
          className="h-12 w-12 drop-shadow-[0_0_15px_rgba(217,170,74,0.35)] sm:h-16 sm:w-16"
          aria-label="HASWOLF logosu"
        >
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f4d27a" />
              <stop offset="50%" stopColor="#c59231" />
              <stop offset="100%" stopColor="#7c5016" />
            </linearGradient>
          </defs>

          <path
            d="M18 20 L45 34 L60 22 L75 34 L102 20 L92 59 L103 82 L78 105 L60 94 L42 105 L17 82 L28 59 Z"
            fill="#090909"
            stroke="url(#gold)"
            strokeWidth="5"
          />
          <path d="M29 31 L46 43 L37 60 Z" fill="url(#gold)" />
          <path d="M91 31 L74 43 L83 60 Z" fill="url(#gold)" />
          <path d="M37 62 L53 57 L47 72 Z" fill="#f5c451" />
          <path d="M83 62 L67 57 L73 72 Z" fill="#f5c451" />
          <path
            d="M47 79 L60 86 L73 79 L67 94 L60 98 L53 94 Z"
            fill="url(#gold)"
          />
          <path d="M52 74 L60 68 L68 74 L60 82 Z" fill="#d6a33d" />
        </svg>
      </div>

      <div>
        <div className="text-xl font-black tracking-[0.14em] text-[#d9aa4a] sm:text-3xl sm:tracking-[0.18em]">
          HASWOLF
        </div>
        <div className="text-[8px] tracking-[0.28em] text-zinc-500 sm:text-[10px] sm:tracking-[0.34em]">
          MARKET
        </div>
      </div>
    </a>
  );
}

export default function Home() {
  const [market, setMarket] = useState<MarketType>("item");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedServer, setSelectedServer] = useState("EPHESUS");
  const [selectedCategory, setSelectedCategory] = useState("Tüm Ürünler");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsAdmin(user?.email === "haswolf666@gmail.com");
    }

    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user.email === "haswolf666@gmail.com");
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,category,item_category,server,price,description,image_url,stock,is_active,created_at")
        .eq("is_active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setProductsError(error.message);
        setProductsLoading(false);
        return;
      }

      setProducts((data ?? []) as Product[]);
      setProductsError("");
      setProductsLoading(false);
    }

    loadProducts();

    const channel = supabase
      .channel("public-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => loadProducts(),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const displayedItemProducts = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        product.category === "item" &&
        product.server === selectedServer &&
        (selectedCategory === "Tüm Ürünler" ||
          (product.item_category ?? "Diğer") === selectedCategory),
    );

    if (sortOption === "price-asc") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    if (sortOption === "price-desc") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }

    if (sortOption === "newest") {
      return [...filtered].sort((a, b) =>
        (b.created_at ?? "").localeCompare(a.created_at ?? ""),
      );
    }

    return filtered;
  }, [products, selectedServer, selectedCategory, sortOption]);

  const displayedYangPackages = useMemo(() => {
    const filtered = products.filter(
      (product) => product.category === "yang" && product.server === selectedServer,
    );

    if (sortOption === "price-asc") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    if (sortOption === "price-desc") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, selectedServer, sortOption]);

  const displayedAccounts = useMemo(() => {
    const filtered = products.filter(
      (product) => product.category === "account" && product.server === selectedServer,
    );

    if (sortOption === "price-asc") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    if (sortOption === "price-desc") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, selectedServer, sortOption]);

  function goToMarket(type: MarketType) {
    setMarket(type);
    setMobileMenuOpen(false);

    window.setTimeout(() => {
      document.getElementById("market")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function openWhatsApp(message: string) {
    const url = `https://wa.me/905010942080?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main id="top" className="min-h-screen w-full overflow-x-hidden bg-[#050707] pb-[env(safe-area-inset-bottom)] text-white">
      <header className="haswolf-header sticky top-0 z-50 border-b border-[#8c641e]/40 bg-black/90 backdrop-blur-2xl">
        <div className="haswolf-container flex h-[62px] items-center justify-between sm:h-[70px] lg:h-auto lg:py-3">
          <WolfLogo />

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] p-1.5 text-sm text-zinc-300 lg:flex">
            <a href="#top" className="rounded-full px-4 py-2.5 transition hover:bg-white/5 hover:text-[#d9aa4a]">
              Ana Sayfa
            </a>
            <a href="/topluluk" className="rounded-full px-4 py-2.5 transition hover:bg-white/5 hover:text-[#d9aa4a]">
              Sohbet Odaları
            </a>
            <button onClick={() => goToMarket("item")} className="rounded-full px-4 py-2.5 transition hover:bg-white/5 hover:text-[#d9aa4a]">
              Item
            </button>
            <button onClick={() => goToMarket("account")} className="rounded-full px-4 py-2.5 transition hover:bg-white/5 hover:text-[#d9aa4a]">
              Karakter
            </button>
            <button onClick={() => goToMarket("yang")} className="rounded-full px-4 py-2.5 transition hover:bg-white/5 hover:text-[#d9aa4a]">
              Yang
            </button>
            <a href="#footer" className="rounded-full px-4 py-2.5 transition hover:bg-white/5 hover:text-[#d9aa4a]">
              İletişim
            </a>
            {isAdmin && (
              <a href="/admin" className="rounded-full px-4 py-2.5 transition hover:bg-white/5 hover:text-[#d9aa4a]">
                Admin
              </a>
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <AuthButton />
            <button
              onClick={() =>
                openWhatsApp("Merhaba Haswolf, destek almak istiyorum.")
              }
              className="rounded-lg border border-[#b8862c] px-4 py-3 text-sm font-semibold text-[#e8bd67] transition hover:bg-[#d7a947] hover:text-black"
            >
              7/24 Destek
            </button>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#b8862c] text-2xl text-[#e8bd67] lg:hidden"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="max-h-[calc(100vh-68px)] overflow-y-auto border-t border-[#8c641e]/30 bg-black/98 px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3 text-sm text-zinc-200">
              <a
                href="#top"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-white/5 px-4 py-3"
              >
                Ana Sayfa
              </a>
              <a
                href="/topluluk"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-white/5 px-4 py-3"
              >
                Sohbet Odaları
              </a>
              <button
                onClick={() => goToMarket("item")}
                className="rounded-lg bg-white/5 px-4 py-3 text-left"
              >
                Item
              </button>
              <button
                onClick={() => goToMarket("account")}
                className="rounded-lg bg-white/5 px-4 py-3 text-left"
              >
                Karakter
              </button>
              <button
                onClick={() => goToMarket("yang")}
                className="rounded-lg bg-white/5 px-4 py-3 text-left"
              >
                Yang
              </button>
              <a
                href="#footer"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-white/5 px-4 py-3"
              >
                İletişim
              </a>
              {isAdmin && (
                <a
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white/5 px-4 py-3"
                >
                  Admin Paneli
                </a>
              )}

              <div className="rounded-lg bg-white/5 px-4 py-3">
                <AuthButton />
              </div>

              <button
                onClick={() =>
                  openWhatsApp("Merhaba Haswolf, destek almak istiyorum.")
                }
                className="rounded-lg border border-green-500/50 bg-green-900/40 px-4 py-3 text-left text-green-300"
              >
                WhatsApp Destek
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobil hızlı menü: header ile ana alan arasındaki şerit */}
      <nav
        aria-label="Mobil hızlı menü"
        className="sticky top-[62px] z-40 sm:top-[70px] border-b border-[#8c641e]/35 bg-[#070909]/95 backdrop-blur-xl lg:hidden"
      >
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <a
            href="#top"
            className="min-w-max snap-start rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#b8862c] hover:text-[#e8bd67]"
          >
            ⌂ Ana Sayfa
          </a>

          <a
            href="/topluluk"
            className="min-w-max snap-start rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#b8862c] hover:text-[#e8bd67]"
          >
            👥 Sohbet Odaları
          </a>

          <button
            type="button"
            onClick={() => goToMarket("item")}
            className="min-w-max snap-start rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#b8862c] hover:text-[#e8bd67]"
          >
            ⚔ Item
          </button>

          <button
            type="button"
            onClick={() => goToMarket("account")}
            className="min-w-max snap-start rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#b8862c] hover:text-[#e8bd67]"
          >
            👤 Karakter
          </button>

          <button
            type="button"
            onClick={() => goToMarket("yang")}
            className="min-w-max snap-start rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#b8862c] hover:text-[#e8bd67]"
          >
            ◉ Yang
          </button>

          <a
            href="#footer"
            className="min-w-max snap-start rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#b8862c] hover:text-[#e8bd67]"
          >
            ☎ İletişim
          </a>

          {isAdmin && (
            <a
              href="/admin"
              className="min-w-max snap-start rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#b8862c] hover:text-[#e8bd67]"
            >
              🛡 Admin
            </a>
          )}

          <button
            type="button"
            onClick={() =>
              openWhatsApp("Merhaba Haswolf, destek almak istiyorum.")
            }
            className="min-w-max snap-start rounded-lg border border-green-500/40 bg-green-900/30 px-4 py-2.5 text-sm font-medium text-green-300 transition hover:bg-green-800/40"
          >
            WhatsApp Destek
          </button>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-[#8c641e]/35">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(190,120,25,0.22),transparent_35%),linear-gradient(110deg,#050707_20%,#10100d_55%,#070707)]" />

        <div className="haswolf-container relative grid min-h-[285px] items-center gap-4 py-7 sm:min-h-[330px] sm:py-9 md:grid-cols-[1fr_0.45fr] lg:min-h-[360px] lg:grid-cols-[1fr_0.62fr] lg:gap-8 lg:py-10">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#d5a23e] sm:text-sm sm:tracking-[0.32em]">
              GÜVENİLİR • HIZLI • PROFESYONEL
            </p>

            <h1 className="mt-3 text-[34px] font-black leading-none tracking-[0.06em] text-[#d9aa4a] sm:text-5xl md:text-6xl lg:text-7xl">
              HASWOLF
            </h1>

            <h2 className="mt-3 text-sm tracking-[0.38em] text-zinc-300 sm:text-xl">
              MARKET
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:mt-5 sm:text-base sm:leading-7">
              Item, Yang ve karakter alışverişinde güvenli, hızlı ve seçkin
              pazar deneyimi.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              <button
                onClick={() => goToMarket("item")}
                className="min-h-11 w-full rounded-lg bg-gradient-to-b from-[#e6ba58] to-[#a97521] px-3 py-3 text-center text-sm font-bold text-black sm:w-auto sm:px-6"
              >
                Markete Git
              </button>

              <a
                href="#nasil-alisveris"
                className="min-h-11 w-full rounded-lg border border-[#88652b] px-3 py-3 text-center text-sm font-semibold text-[#e0bb70] sm:w-auto sm:px-6"
              >
                Nasıl Alışveriş Yapılır?
              </a>
            </div>
          </div>

          <div className="hidden justify-center md:flex">
            <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-[#b18131]/30 bg-[radial-gradient(circle,#33220c,#090909_65%)] shadow-2xl shadow-amber-600/10 lg:h-60 lg:w-60">
              <svg viewBox="0 0 120 120" className="h-36 w-36 lg:h-44 lg:w-44">
                <path
                  d="M18 20 L45 34 L60 22 L75 34 L102 20 L92 59 L103 82 L78 105 L60 94 L42 105 L17 82 L28 59 Z"
                  fill="#080808"
                  stroke="#d9aa4a"
                  strokeWidth="4"
                />
                <path d="M29 31 L46 43 L37 60 Z" fill="#c59231" />
                <path d="M91 31 L74 43 L83 60 Z" fill="#c59231" />
                <path d="M37 62 L53 57 L47 72 Z" fill="#ffd56a" />
                <path d="M83 62 L67 57 L73 72 Z" fill="#ffd56a" />
                <path
                  d="M47 79 L60 86 L73 79 L67 94 L60 98 L53 94 Z"
                  fill="#c59231"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
        <div className="rounded-xl border border-[#8c641e]/40 bg-[#0d0f0f]/95 p-3 sm:p-4">
          <h2 className="mb-3 text-center text-sm font-bold text-[#ddb45b] sm:text-base">
            ─── SUNUCU SEÇİNİZ ───
          </h2>

          <div className="mobile-swipe-row -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
            {servers.map((server) => {
              const active = selectedServer === server.name;

              return (
                <button
                  key={server.name}
                  onClick={() => setSelectedServer(server.name)}
                  className={`min-w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] snap-center rounded-xl border bg-black/70 p-4 text-left transition sm:min-w-[min(420px,78vw)] sm:max-w-[min(420px,78vw)] md:min-w-0 md:max-w-none md:p-5 md:hover:-translate-y-1 ${
                    active ? "scale-[1.01]" : ""
                  }`}
                  style={{
                    borderColor: server.color,
                    boxShadow: active ? `0 0 35px ${server.color}44` : "none",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-2xl sm:h-16 sm:w-16 sm:text-3xl"
                      style={{
                        borderColor: server.color,
                        color: server.color,
                        background: `${server.color}18`,
                      }}
                    >
                      ◆
                    </div>

                    <div>
                      <h3
                        className="text-xl font-black sm:text-2xl"
                        style={{ color: server.color }}
                      >
                        {server.name}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-400">
                        <span style={{ color: server.color }}>●</span> Online
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="market" className="scroll-mt-20 mx-auto max-w-[1500px] px-4 pb-6 sm:px-6">
        <div className="flex snap-x gap-2 overflow-x-auto rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-2 md:grid md:grid-cols-3 md:gap-3 md:p-3">
          <button
            onClick={() => goToMarket("item")}
            className={`min-w-[180px] snap-start whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "item"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            ⚔ ITEM MARKET
          </button>

          <button
            onClick={() => goToMarket("yang")}
            className={`min-w-[180px] snap-start whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "yang"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            🪙 YANG MARKET
          </button>

          <button
            onClick={() => goToMarket("account")}
            className={`min-w-[180px] snap-start whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "account"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            👤 HESAP / KARAKTER
          </button>
        </div>
      </section>

      {productsLoading && (
        <section className="mx-auto max-w-[1500px] px-4 pb-6 sm:px-6">
          <div className="rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-6 text-center text-zinc-400">
            İlanlar yükleniyor...
          </div>
        </section>
      )}

      {productsError && (
        <section className="mx-auto max-w-[1500px] px-4 pb-6 sm:px-6">
          <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-6 text-center text-red-300">
            İlanlar yüklenemedi: {productsError}
          </div>
        </section>
      )}

      {market === "item" && (
        <section className="mx-auto grid w-full max-w-[1500px] gap-3 px-3 pb-10 sm:px-5 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-6">
          <aside>
            <div className="rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-3">
              <h2 className="border-b border-[#765625]/40 px-3 py-4 font-bold text-[#ddb45b] sm:px-4 sm:py-5">
                ✣ KATEGORİLER
              </h2>

              <div className="mobile-swipe-row mt-3 flex snap-x gap-2 overflow-x-auto overscroll-x-contain pb-2 lg:block lg:space-y-2 lg:overflow-visible">
                {categories.map(([icon, name]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedCategory(name)}
                    aria-pressed={selectedCategory === name}
                    className={`flex min-w-max items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm transition lg:w-full lg:gap-4 lg:py-4 ${
                      selectedCategory === name
                        ? "border-[#c7973d] bg-gradient-to-r from-[#795315] to-[#bd8d32] text-black"
                        : "border-white/10 bg-[#121515] text-zinc-300 hover:border-[#9c7432] hover:text-[#e6bd68]"
                    }`}
                  >
                    <span className="w-6 text-center text-lg">{icon}</span>
                    <span className="font-semibold">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <SecurityBox />
            </div>
          </aside>

          <div className="min-w-0 rounded-xl border border-[#765625]/50 bg-[#090b0b] p-3 sm:p-4">
            <MarketTitle
              server={selectedServer}
              title={
                selectedCategory === "Tüm Ürünler"
                  ? "TÜM ÜRÜNLER"
                  : selectedCategory.toUpperCase()
              }
              color="#55d35a"
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {displayedItemProducts.map((product) => {
                const details = descriptionLines(product.description);

                return (
                  <article
                    key={product.id}
                    className="haswolf-product-card group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#151818] to-[#080909] transition duration-300 hover:-translate-y-1.5 hover:border-[#d0a14b]/80"
                  >
                    <div className="p-4">
                      <h3 className="text-center text-base font-bold text-[#e7b74f] sm:text-lg">
                        {product.name}
                      </h3>

                      <div className="relative mt-3 flex h-44 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(217,170,74,.13),transparent_55%),#070808] sm:h-48">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="text-6xl">⚔️</span>
                        )}
                      </div>

                      <ul className="mt-3 max-h-24 space-y-1 overflow-y-auto pr-1 text-xs leading-5 text-zinc-400 sm:min-h-28 sm:max-h-none">
                        {details.length > 0 ? (
                          details.map((detail) => <li key={detail}>◆ {detail}</li>)
                        ) : (
                          <li>Ürün detayları için WhatsApp üzerinden bilgi alabilirsin.</li>
                        )}
                      </ul>

                      <div className="mt-4 border-t border-white/10 pt-4 text-center text-xl font-black text-[#e7b74f]">
                        ◉ {formatPrice(product.price)}
                      </div>

                      <p className="mt-2 text-center text-xs text-zinc-500">
                        Stok: {product.stock}
                      </p>

                      <WhatsAppButton
                        message={`Merhaba Haswolf, ${selectedServer} sunucusundaki ${product.name} ürünü hakkında bilgi almak istiyorum.`}
                      />
                    </div>
                  </article>
                );
              })}

              {!productsLoading && displayedItemProducts.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-[#765625]/60 bg-black/20 px-6 py-12 text-center">
                  <div className="text-4xl">📦</div>
                  <h3 className="mt-4 text-lg font-bold text-[#ddb45b]">
                    Bu kategoride henüz ürün yok
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    Admin panelinden ürün eklediğinde burada otomatik görünecek.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {market === "yang" && (
        <section className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-6">
          <div className="rounded-xl border border-[#765625]/50 bg-[#090b0b] p-3 sm:p-6">
            <MarketTitle
              server={selectedServer}
              title="YANG MARKET"
              color="#e5b64e"
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedYangPackages.map((pack) => (
                <article
                  key={pack.id}
                  className="rounded-xl border border-[#8b672d]/60 bg-gradient-to-b from-[#15130d] to-[#080909] p-5 text-center transition hover:-translate-y-1 hover:border-[#e2b64e] sm:p-7"
                >
                  <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    {pack.image_url ? (
                      <img
                        src={pack.image_url}
                        alt={pack.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-6xl">🪙</span>
                    )}
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-[#e5b64e] sm:text-3xl">
                    {pack.name}
                  </h3>
                  {pack.description && (
                    <p className="mt-3 whitespace-pre-line text-sm text-emerald-400">
                      {pack.description}
                    </p>
                  )}
                  <div className="mt-7 text-2xl font-black">
                    {formatPrice(pack.price)}
                  </div>
                  <p className="mt-3 text-sm text-zinc-500">
                    Sunucu: {selectedServer} · Stok: {pack.stock}
                  </p>

                  <WhatsAppButton
                    message={`Merhaba Haswolf, ${selectedServer} sunucusu için ${pack.name} ilanı hakkında bilgi almak istiyorum.`}
                  />
                </article>
              ))}

              {!productsLoading && displayedYangPackages.length === 0 && (
                <EmptyMarketMessage />
              )}
            </div>
          </div>
        </section>
      )}

      {market === "account" && (
        <section className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-6">
          <div className="rounded-xl border border-[#765625]/50 bg-[#090b0b] p-3 sm:p-6">
            <MarketTitle
              server={selectedServer}
              title="HESAP / KARAKTER MARKET"
              color="#b660ff"
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {displayedAccounts.map((account) => {
                const details = descriptionLines(account.description);

                return (
                  <article
                    key={account.id}
                    className="rounded-xl border border-[#765625]/50 bg-gradient-to-b from-[#131017] to-[#070909] p-5 transition hover:-translate-y-1 hover:border-purple-400 sm:p-6"
                  >
                    <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30 sm:h-40">
                      {account.image_url ? (
                        <img
                          src={account.image_url}
                          alt={account.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-7xl">👤</span>
                      )}
                    </div>

                    <h3 className="mt-5 text-center text-2xl font-black text-purple-400">
                      {account.name}
                    </h3>

                    <ul className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm text-zinc-400">
                      {details.length > 0 ? (
                        details.map((detail) => <li key={detail}>◆ {detail}</li>)
                      ) : (
                        <li>Hesap detayları için WhatsApp üzerinden bilgi alabilirsin.</li>
                      )}
                    </ul>

                    <div className="mt-6 text-center text-2xl font-black text-[#e5b64e]">
                      {formatPrice(account.price)}
                    </div>

                    <p className="mt-2 text-center text-xs text-zinc-500">
                      Stok: {account.stock}
                    </p>

                    <WhatsAppButton
                      message={`Merhaba Haswolf, ${selectedServer} sunucusundaki ${account.name} hesabı hakkında bilgi almak istiyorum.`}
                    />
                  </article>
                );
              })}

              {!productsLoading && displayedAccounts.length === 0 && (
                <EmptyMarketMessage />
              )}
            </div>
          </div>
        </section>
      )}

      <section id="nasil-alisveris" className="scroll-mt-20 mx-auto max-w-[1500px] px-4 pb-12 sm:px-6">
        <div className="rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-5 sm:p-8">
          <h2 className="text-center text-xl font-black text-[#ddb45b] sm:text-2xl">
            Nasıl Alışveriş Yapılır?
          </h2>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              [
                "1",
                "Ürünü seç",
                "Sunucu ve market türünü seçip almak istediğin ürünü belirle.",
              ],
              [
                "2",
                "WhatsApp'tan yaz",
                "Ürün kartındaki WhatsApp düğmesine dokun; hazır mesaj doğrudan açılır.",
              ],
              [
                "3",
                "Güvenli teslimat",
                "Ödeme ve teslimat bilgileri doğrulandıktan sonra işlem tamamlanır.",
              ],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-xl border border-[#765625]/40 bg-black/30 p-5 sm:p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d9aa4a] text-lg font-black text-black">
                  {number}
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-6">
        <div className="grid gap-4 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-5 sm:p-7 md:grid-cols-4">
          {[
            ["⚡", "HIZLI TESLİMAT", "Siparişin en kısa sürede teslim edilir."],
            ["🎧", "7/24 DESTEK", "Her an bizimle iletişime geçebilirsin."],
            ["🛡️", "GÜVENLİ TİCARET", "İşlemler güvenli yürütülür."],
            ["🏅", "MEMNUNİYET", "Memnuniyet önceliğimizdir."],
          ].map(([icon, title, text]) => (
            <div key={title} className="p-4 text-center">
              <div className="text-4xl">{icon}</div>
              <h3 className="mt-4 font-bold text-[#ddb45b]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
      <MobileBottomNav activeMarket={market} onMarketChange={goToMarket} />
    </main>
  );
}

function MarketTitle({
  server,
  title,
  color,
  sortOption,
  onSortChange,
}: {
  server: string;
  title: string;
  color: string;
  sortOption: SortOption;
  onSortChange: (value: SortOption) => void;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 border-b border-[#765625]/40 pb-5 md:flex-row md:items-center">
      <div className="min-w-0">
        <span className="text-lg font-bold sm:text-xl" style={{ color }}>
          {server}
        </span>
        <span className="mx-2 text-zinc-600 sm:mx-3">›</span>
        <span className="break-words text-sm font-semibold sm:text-lg">
          {title}
        </span>
      </div>

      <select
        value={sortOption}
        onChange={(event) =>
          onSortChange(event.target.value as SortOption)
        }
        className="w-full rounded-lg border border-[#765625]/50 bg-[#151717] px-4 py-3 text-sm text-zinc-300 outline-none md:w-auto"
      >
        <option value="recommended">Önerilen Sıralama</option>
        <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
        <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
        <option value="newest">Yeni Eklenenler</option>
      </select>
    </div>
  );
}

function WhatsAppButton({ message }: { message: string }) {
  const href = `https://wa.me/905010942080?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 block min-h-12 w-full rounded-lg border border-green-400/50 bg-gradient-to-b from-green-700 to-green-900 px-3 py-3 text-center text-sm font-semibold text-white transition hover:brightness-125"
    >
      ☎ WhatsApp ile Satın Al
    </a>
  );
}

function EmptyMarketMessage() {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-[#765625]/60 bg-black/20 px-6 py-12 text-center">
      <div className="text-4xl">📦</div>
      <h3 className="mt-4 text-lg font-bold text-[#ddb45b]">
        Bu bölümde henüz aktif ilan yok
      </h3>
      <p className="mt-2 text-sm text-zinc-500">
        Admin panelinden eklenen aktif ve stoklu ilanlar burada otomatik görünür.
      </p>
    </div>
  );
}

function SecurityBox() {
  return (
    <div className="mt-5 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-6">
      <h3 className="text-center font-bold text-[#ddb45b]">
        GÜVENLİ ALIŞVERİŞ
      </h3>

      <div className="mt-6 space-y-5 text-sm text-zinc-400">
        <p>🛡️ %100 Güvenli Ticaret</p>
        <p>⚡ Hızlı Teslimat</p>
        <p>🎧 7/24 Canlı Destek</p>
        <p>⭐ Memnuniyet Garantisi</p>
      </div>
    </div>
  );
}