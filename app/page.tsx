"use client";

import AuthButton from "../components/AuthButton";
import MobileBottomNav from "../components/MobileBottomNav";
import SiteFooter from "../components/SiteFooter";
import FloatingWhatsApp from "../components/FloatingWhatsApp";
import NotificationCenter from "../components/NotificationCenter";
import AutoTranslate from "../components/AutoTranslate";
import LanguageSelector from "../components/LanguageSelector";
import ProductExperience from "../components/ProductExperience";
import SmartSearch from "../components/SmartSearch";
import CompareDock from "../components/CompareDock";
import AdminLiveVisitors from "../components/AdminLiveVisitors";
import InstallAppButton from "./components/InstallAppButton";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type MarketType = "item" | "yang" | "dc" | "account";
type SortOption = "recommended" | "price-asc" | "price-desc" | "newest";

type Product = {
  id: number;
  name: string;
  category: MarketType;
  item_category: string | null;
  server: "EPHESUS" | "PERGAMON" | "TEOS";
  price: number;
  old_price: number | null;
  description: string | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at?: string;
  delivery_time?: string | null;
  view_count?: number | null;
  favorite_count?: number | null;
  is_daily_favorite?: boolean | null;
  is_best_price?: boolean | null;
  low_stock_alert?: boolean | null;
};

function formatPrice(price: number, unit: "TL" | "M" = "TL") {
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(price)} ${unit}`;
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

function YangIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#d9aa4a" stroke="#f4d27a" strokeWidth="1.5" />
      <path d="M8 7.5 12 10l4-2.5-1.2 4.2 2.2 3.1-4.2-.1L12 18l-.8-3.3-4.2.1 2.2-3.1Z" fill="#5b3908" stroke="#fff0b0" strokeWidth=".65" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.25" fill="#f8de8c" />
    </svg>
  );
}

function SocialIcon({ name }: { name: "youtube" | "instagram" | "tiktok" | "discord" }) {
  if (name === "youtube") return <span className="social-brand social-brand--youtube">▶</span>;
  if (name === "instagram") return <span className="social-brand social-brand--instagram">◎</span>;
  if (name === "tiktok") return <span className="social-brand social-brand--tiktok">♪</span>;
  return <span className="social-brand social-brand--discord">☁</span>;
}

const headerSocials = [
  { name: "youtube" as const, label: "YouTube", detail: "HASWOLF TV", href: "https://www.youtube.com/@ROYALEONLINEHASWOLF" },
  { name: "instagram" as const, label: "Instagram", detail: "@royaleonlinehaswolf", href: "https://www.instagram.com/royaleonlinehaswolf" },
  { name: "tiktok" as const, label: "TikTok", detail: "@haswolfgame", href: "https://www.tiktok.com/@haswolfgame" },
  { name: "discord" as const, label: "Discord", detail: "HASWOLF Topluluğu", href: "#footer" },
];

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
        .select("id,name,category,item_category,server,price,old_price,description,image_url,stock,is_active,created_at,delivery_time,view_count,favorite_count,is_daily_favorite,is_best_price,low_stock_alert")
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

    const refreshProducts = () => loadProducts();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadProducts();
    };
    window.addEventListener("focus", refreshProducts);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      window.removeEventListener("focus", refreshProducts);
      document.removeEventListener("visibilitychange", handleVisibility);
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
    const filtered = products.filter((product) => product.category === "yang");

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
  }, [products, sortOption]);

  const yangPackagesByServer = useMemo(
    () =>
      servers.map((server) => ({
        ...server,
        products: displayedYangPackages.filter(
          (product) => product.server === server.name,
        ),
      })),
    [displayedYangPackages],
  );

  const displayedDcPackages = useMemo(() => {
    const filtered = products.filter((product) => product.category === "dc");

    if (sortOption === "price-asc") return [...filtered].sort((a, b) => a.price - b.price);
    if (sortOption === "price-desc") return [...filtered].sort((a, b) => b.price - a.price);
    if (sortOption === "newest") {
      return [...filtered].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return filtered;
  }, [products, sortOption]);

  const dcPackagesByServer = useMemo(
    () => servers.map((server) => ({
      ...server,
      products: displayedDcPackages.filter((product) => product.server === server.name),
    })),
    [displayedDcPackages],
  );

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
      <header className="haswolf-header sticky top-0 z-50 border-b border-[#8c641e]/40 bg-black/95 backdrop-blur-2xl">
        <div className="haswolf-container">
          <div className="haswolf-topbar">
            <WolfLogo /><div className="haswolf-topbar__actions">
              <div className="haswolf-social-strip">
              {headerSocials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                  className="haswolf-header-social"
                >
                  <SocialIcon name={social.name} />
                  <span className="min-w-0">
                    <strong>{social.label}</strong>
                    <small>{social.detail}</small>
                  </span>
                </a>
              ))}
              </div>

            <div className="haswolf-header-account">
              <AuthButton />
            </div>
            </div>
          </div>

          <nav aria-label="Ana navigasyon" className="haswolf-main-nav">
            <a href="#top"><span aria-hidden="true">⌂</span><span>Ana Sayfa</span></a>
            <button type="button" onClick={() => goToMarket("item")}><span aria-hidden="true">⚔</span><span>Item</span></button>
            <button type="button" onClick={() => goToMarket("account")}><span aria-hidden="true">♟</span><span>Karakter</span></button>
            <button type="button" onClick={() => goToMarket("yang")}><YangIcon /><span>Yang</span></button>
            <button type="button" onClick={() => goToMarket("dc")}><span aria-hidden="true">💎</span><span>DC Satış</span></button>
            <a href="/topluluk" className="haswolf-chat-before-admin">
              <span aria-hidden="true">👥</span>
              <span>Sohbet Odaları</span>
            </a>
            {isAdmin && <a href="/admin"><span aria-hidden="true">🛡</span><span>Admin</span></a>}
            <LanguageSelector />
            <NotificationCenter deals={products.map(({id,name,price,old_price,server,category,created_at,stock,is_daily_favorite,is_best_price,low_stock_alert})=>({id,name,price,old_price,server,category,created_at,stock,is_daily_favorite:Boolean(is_daily_favorite),is_best_price:Boolean(is_best_price),low_stock_alert:Boolean(low_stock_alert)}))} />
          </nav>
        </div>

        {mobileMenuOpen && (
          <div className="haswolf-mobile-drawer lg:hidden">
            <div className="haswolf-container py-3">
              <nav className="haswolf-mobile-drawer__links" aria-label="Mobil menü">
                <a href="#top"><span>⌂</span><span>Ana Sayfa</span></a>
                <button type="button" onClick={() => goToMarket("item")}><span>⚔</span><span>Item</span></button>
                <button type="button" onClick={() => goToMarket("account")}><span>♟</span><span>Karakter</span></button>
                <button type="button" onClick={() => goToMarket("yang")}><span>◉</span><span>Yang</span></button>
                <button type="button" onClick={() => goToMarket("dc")}><span>💎</span><span>DC Satış</span></button>
                <a href="/topluluk"><span>✦</span><span>Sohbet Odaları</span></a>
              </nav>

              <details className="haswolf-mobile-socials">
                <summary><span>◎</span><span>Sosyal Medyalar</span><span>＋</span></summary>
                <div>
                  {headerSocials.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target={social.href.startsWith("http") ? "_blank" : undefined}
                      rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                    >
                      <SocialIcon name={social.name} />
                      <span>{social.label}</span>
                    </a>
                  ))}
                </div>
              </details>

              <div className="haswolf-mobile-drawer__auth"><AuthButton /></div>
            </div>
          </div>
        )}
      </header>

      <section className="haswolf-hero relative overflow-hidden border-b border-[#8c641e]/35">
        <div className="haswolf-hero__background absolute inset-0" />
        <div className="haswolf-hero__particles absolute inset-0" aria-hidden="true" />

        <div className="haswolf-container relative grid min-h-[285px] items-center gap-4 py-7 sm:min-h-[330px] sm:py-9 md:grid-cols-[1fr_0.45fr] lg:min-h-[360px] lg:grid-cols-[1fr_0.62fr] lg:gap-8 lg:py-10">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#d5a23e] sm:text-sm sm:tracking-[0.32em]">
              GÜVENİLİR • HIZLI • PROFESYONEL
            </p>

            <h1 className="haswolf-hero__title mt-3 text-[34px] font-black leading-none tracking-[0.06em] text-[#d9aa4a] sm:text-5xl md:text-6xl lg:text-7xl">
              HASWOLF
            </h1>

            <h2 className="mt-3 text-sm tracking-[0.38em] text-zinc-300 sm:text-xl">
              MARKET
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:mt-5 sm:text-base sm:leading-7">
              Item, Yang, DC ve karakter alışverişinde güvenli, hızlı ve seçkin
              pazar deneyimi.
            </p>

            <div className="mt-5 max-w-xl">
              <div className="haswolf-hero-quick-links">
                  <button type="button" onClick={() => goToMarket("item")}>Markete Git</button>
                  <a href="/cekilis">★ Çekiliş Merkezi</a>
                </div>

              <div className="mt-2 sm:mt-3">
                <InstallAppButton />
              </div>
            </div>
          </div>

          <div className="hidden justify-center md:flex">
            <div className="haswolf-hero__emblem relative flex h-52 w-52 items-center justify-center rounded-full lg:h-60 lg:w-60">
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

          <div className="haswolf-server-grid -mx-1 flex gap-3 px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0 md:pb-0">
            {servers.map((server) => {
              const active = selectedServer === server.name;

              return (
                <div
                  key={server.name}
                  className={`min-w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] snap-center rounded-xl border bg-black/70 p-4 transition sm:min-w-[min(420px,78vw)] sm:max-w-[min(420px,78vw)] md:min-w-0 md:max-w-none md:p-5 md:hover:-translate-y-1 ${active ? "scale-[1.01]" : ""}`}
                  style={{ borderColor: server.color, boxShadow: active ? `0 0 35px ${server.color}44` : "none" }}
                >
                  <button type="button" onClick={() => setSelectedServer(server.name)} className="w-full text-left">
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
                  <div className="haswolf-server-actions mt-4">
                    <button
                      type="button"
                      onClick={() => openWhatsApp(`Merhaba Haswolf, ${server.name} sunucusundan Yang, DC veya ürün satın almak istiyorum.`)}
                      className="haswolf-buy-button"
                    >
                      BİZDEN SATIN AL
                    </button>
                    <button
                      type="button"
                      onClick={() => openWhatsApp(`Merhaba Haswolf, ${server.name} sunucusunda Yang veya oyun içi varlık satmak istiyorum.`)}
                      className="haswolf-sell-button"
                    >
                      BİZE SAT
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-3 pb-4 sm:px-6">
        <SmartSearch products={products} onPick={(product) => {
          setMarket(product.category as MarketType);
          setSelectedServer(product.server);
          window.setTimeout(() => document.getElementById("market")?.scrollIntoView({ behavior: "smooth" }), 0);
        }} />
      </section>

      <section id="market" className="scroll-mt-20 mx-auto max-w-[1500px] px-4 pb-6 sm:px-6">
        <div className="haswolf-market-tabs grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-2 md:gap-3 md:p-3">
          <button
            onClick={() => goToMarket("item")}
            className={`min-w-0 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "item"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            ⚔ ITEM MARKET
          </button>

          <button
            onClick={() => goToMarket("yang")}
            className={`min-w-0 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "yang"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            🪙 YANG MARKET
          </button>

          <button
            onClick={() => goToMarket("dc")}
            className={`min-w-0 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
              market === "dc"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            💎 DC SATIŞ
          </button>

          <button
            onClick={() => goToMarket("account")}
            className={`min-w-0 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold transition md:min-w-0 md:px-5 md:py-4 ${
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
            <details className="haswolf-category-drawer rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-3">
              <summary className="haswolf-category-summary">
                <span>✣ KATEGORİLER</span><span className="haswolf-category-summary__hint">Dokun ve Aç</span><span className="haswolf-category-summary__chevron">▼</span>
              </summary>

              <div className="haswolf-category-grid mt-3 grid gap-2 lg:block lg:space-y-2">
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
              <div className="haswolf-upcoming-games">
                <h3>Diğer Oyunlar</h3>
                {['Knight Online','Silkroad Online','World of Warcraft','Valorant','PUBG','League of Legends'].map((game) => (
                  <div key={game}><span>{game}</span><b>YAKINDA !!</b></div>
                ))}
              </div>
            </details>

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
                        <PriceDisplay price={product.price} oldPrice={product.old_price} />
                      </div>

                      <ProductExperience product={product} />

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
        <section className="mx-auto max-w-[1500px] px-3 pb-12 sm:px-6">
          <div className="rounded-xl border border-[#765625]/50 bg-[#090b0b] p-3 sm:p-5">
            <MarketTitle
              server="GENEL"
              title="YANG MARKET"
              color="#e5b64e"
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <div className="haswolf-yang-server-grid">
              {yangPackagesByServer.map((group) => (
                <section
                  key={group.name}
                  className="haswolf-yang-server-column"
                  style={{ "--server-color": group.color } as React.CSSProperties}
                >
                  <header className="haswolf-yang-server-heading">
                    <div>
                      <p>Sunucu</p>
                      <h3>{group.name}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span>{group.products.length} ilan</span>
                      <button
                        type="button"
                        onClick={() => openWhatsApp(`Merhaba Haswolf, ${group.name} sunucusunda Yang satmak istiyorum.`)}
                        className="haswolf-sell-button"
                      >
                        Bize Sat
                      </button>
                    </div>
                  </header>

                  <div className="haswolf-yang-list">
                    {group.products.length > 0 ? (
                      group.products.map((pack) => (
                        <article key={pack.id} className="haswolf-yang-card">
                          <div className="haswolf-yang-card__media">
                            {pack.image_url ? (
                              <img src={pack.image_url} alt={pack.name} />
                            ) : (
                              <span aria-hidden="true">🪙</span>
                            )}
                          </div>

                          <div className="haswolf-yang-card__content">
                            <div className="haswolf-yang-card__title-row">
                              <h4>{pack.name}</h4>
                              <PriceDisplay price={pack.price} oldPrice={pack.old_price} />
                            </div>

                            {pack.description && (
                              <p className="haswolf-yang-card__description">
                                {descriptionLines(pack.description).slice(0, 2).join(" · ")}
                              </p>
                            )}

                            <ProductExperience product={pack} compact />
                            <div className="haswolf-yang-card__meta">
                              <span>Stok: {pack.stock}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  openWhatsApp(
                                    `Merhaba Haswolf, ${group.name} sunucusu için ${pack.name} ilanı hakkında bilgi almak istiyorum.`,
                                  )
                                }
                              >WhatsApp ile Satın Al</button>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="haswolf-yang-empty">
                        Bu sunucuda aktif Yang ilanı yok.
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>

            {!productsLoading && displayedYangPackages.length === 0 && (
              <EmptyMarketMessage />
            )}
          </div>
        </section>
      )}

      {market === "dc" && (
        <section className="mx-auto max-w-[1500px] px-3 pb-12 sm:px-6">
          <div className="rounded-xl border border-[#765625]/50 bg-[#090b0b] p-3 sm:p-5">
            <MarketTitle server="GENEL" title="DC SATIŞ" color="#68b8ff" sortOption={sortOption} onSortChange={setSortOption} />
            <div className="haswolf-yang-server-grid">
              {dcPackagesByServer.map((group) => (
                <section key={group.name} className="haswolf-yang-server-column" style={{ "--server-color": group.color } as React.CSSProperties}>
                  <header className="haswolf-yang-server-heading">
                    <div><p>Sunucu</p><h3>{group.name}</h3></div>
                    <span>{group.products.length} ilan</span>
                  </header>
                  <div className="haswolf-yang-list">
                    {group.products.length > 0 ? group.products.map((pack) => (
                      <article key={pack.id} className="haswolf-yang-card">
                        <div className="haswolf-yang-card__media">
                          {pack.image_url ? <img src={pack.image_url} alt={pack.name} /> : <span aria-hidden="true">💎</span>}
                        </div>
                        <div className="haswolf-yang-card__content">
                          <div className="haswolf-yang-card__title-row"><h4>{pack.name}</h4><PriceDisplay price={pack.price} oldPrice={pack.old_price} unit="M" /></div>
                          {pack.description && <p className="haswolf-yang-card__description">{descriptionLines(pack.description).slice(0, 2).join(" · ")}</p>}
                          <ProductExperience product={pack} compact />
                            <div className="haswolf-yang-card__meta">
                            <span>Stok: {pack.stock}</span>
                            <button type="button" onClick={() => openWhatsApp(`Merhaba Haswolf, ${group.name} sunucusu için ${pack.name} DC ilanını satın almak istiyorum.`)}>WhatsApp ile Satın Al</button>
                          </div>
                        </div>
                      </article>
                    )) : <div className="haswolf-yang-empty">Bu sunucuda aktif DC ilanı yok.</div>}
                  </div>
                </section>
              ))}
            </div>
            {!productsLoading && displayedDcPackages.length === 0 && <EmptyMarketMessage />}
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
                      <PriceDisplay price={account.price} oldPrice={account.old_price} />
                    </div>

                    <ProductExperience product={account} />

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
      <AutoTranslate />
      <FloatingWhatsApp />
      <AdminLiveVisitors enabled={isAdmin} />
      <CompareDock />
      <MobileBottomNav activeMarket={market} onMarketChange={goToMarket} />
    </main>
  );
}

function PriceDisplay({ price, oldPrice, unit = "TL" }: { price: number; oldPrice?: number | null; unit?: "TL" | "M" }) {
  const discounted = Boolean(oldPrice && oldPrice > price);
  const percent = discounted ? Math.round(((oldPrice! - price) / oldPrice!) * 100) : 0;
  return <span className="haswolf-price-display">{discounted && <del>{formatPrice(oldPrice!, unit)}</del>}<strong>{formatPrice(price, unit)}</strong>{discounted && <em>%{percent} İNDİRİM</em>}</span>;
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
