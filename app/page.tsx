"use client";
import AuthButton from "../components/AuthButton";
import { useMemo, useState } from "react";

type MarketType = "item" | "yang" | "account";
type SortOption = "recommended" | "price-asc" | "price-desc" | "newest";

function priceToNumber(price: string) {
  return Number(price.replace(/[^0-9]/g, ""));
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

const itemProducts = [
  {
    category: "Kolyeler",
    name: "Anka Kolye +9",
    icon: "🔥",
    rarity: "EFSANE",
    rarityColor: "#ff9d22",
    stars: "★★★★★★",
    price: "3.500 TL",
    stats: [
      "Max. HP +1000",
      "Savunma +150",
      "Yarı İnsanlara Karşı Güç +%20",
      "Büyüye Karşı Dayanıklılık %10",
    ],
  },
  {
    category: "Kolyeler",
    name: "Ejderha Kolye +9",
    icon: "🐉",
    rarity: "MİTOLOJİK",
    rarityColor: "#b660ff",
    stars: "★★★★★★",
    price: "2.750 TL",
    stats: [
      "Max. HP +800",
      "Saldırı Değeri +50",
      "Beceri Hasarı +%15",
      "Kritik Vuruş Şansı +%10",
    ],
  },
  {
    category: "Kolyeler",
    name: "Zodyak Kolye +9",
    icon: "💎",
    rarity: "NADİR",
    rarityColor: "#4d8fff",
    stars: "★★★★★★",
    price: "1.750 TL",
    stats: [
      "Max. HP +600",
      "Büyü Hızı +%20",
      "SP Üretimi +%20",
      "Saldırı Hızı +%10",
    ],
  },
  {
    category: "Kolyeler",
    name: "Ayışığı Kolye +9",
    icon: "🌙",
    rarity: "ELİT",
    rarityColor: "#55dd55",
    stars: "★★★★★",
    price: "1.250 TL",
    stats: [
      "Max. HP +500",
      "Defans +100",
      "Ok Direnci %15",
      "Savaşçıya Karşı Güç +%5",
    ],
  },
  {
    category: "Kolyeler",
    name: "Mavi İnci Kolye +8",
    icon: "🔵",
    rarity: "ELİT",
    rarityColor: "#55dd55",
    stars: "★★★★★",
    price: "950 TL",
    stats: [
      "Max. HP +400",
      "Büyüye Karşı Dayanıklılık %15",
      "Hareket Hızı +%10",
      "Delici Vuruş Şansı +%5",
    ],
  },
  {
    category: "Kolyeler",
    name: "Gümüş Kolye +8",
    icon: "⚪",
    rarity: "NORMAL",
    rarityColor: "#cccccc",
    stars: "★★★★★",
    price: "600 TL",
    stats: [
      "Max. HP +300",
      "Savunma +50",
      "SP Üretimi +%10",
      "Kılıç Savunması %5",
    ],
  },
  {
    category: "Kolyeler",
    name: "Yakut Kolye +7",
    icon: "🔴",
    rarity: "NORMAL",
    rarityColor: "#cccccc",
    stars: "★★★★★",
    price: "400 TL",
    stats: [
      "Max. HP +200",
      "Defans +30",
      "Ok Hızı +%10",
      "Kritik Vuruş Şansı +%5",
    ],
  },
  {
    category: "Kolyeler",
    name: "Cennet Kolye +7",
    icon: "🔷",
    rarity: "NORMAL",
    rarityColor: "#cccccc",
    stars: "★★★★★",
    price: "400 TL",
    stats: [
      "Max. HP +200",
      "Büyü Hızı +%10",
      "Zehirleme Şansı +%5",
      "Şimşek Direnci %10",
    ],
  },];

const yangPackages = [
  { amount: "100 Yang", price: "250 TL", bonus: "Başlangıç Paketi" },
  { amount: "250 Yang", price: "575 TL", bonus: "+10 Yang Hediye" },
  { amount: "500 Yang", price: "1.100 TL", bonus: "+30 Yang Hediye" },
  { amount: "1.000 Yang", price: "2.050 TL", bonus: "+75 Yang Hediye" },
  { amount: "2.500 Yang", price: "4.900 TL", bonus: "+200 Yang Hediye" },
  { amount: "5.000 Yang", price: "9.500 TL", bonus: "+500 Yang Hediye" },
];

const accounts = [
  {
    className: "Savaşçı",
    icon: "⚔️",
    level: "Seviye 120",
    type: "Bedensel",
    price: "12.500 TL",
    details: ["Full PvP dizili", "Simya hazır", "Biyolog tamamlandı"],
  },
  {
    className: "Ninja",
    icon: "🥷",
    level: "Seviye 115",
    type: "Yakın Dövüş",
    price: "9.750 TL",
    details: ["Efsane itemler", "Pet ve kostüm", "Yüksek beceri seviyesi"],
  },
  {
    className: "Sura",
    icon: "🔮",
    level: "Seviye 120",
    type: "Büyülü Silah",
    price: "14.000 TL",
    details: ["Full farm dizili", "Simya mükemmel", "Yüksek yang stoğu"],
  },
  {
    className: "Şaman",
    icon: "🪭",
    level: "Seviye 110",
    type: "Ejderha Gücü",
    price: "7.500 TL",
    details: ["Destek becerileri", "Nadir kostümler", "Biyolog tamamlandı"],
  },
];

function WolfLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg
          viewBox="0 0 120 120"
          className="h-16 w-16 drop-shadow-[0_0_15px_rgba(217,170,74,0.35)]"
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

          <path
            d="M29 31 L46 43 L37 60 Z"
            fill="url(#gold)"
          />

          <path
            d="M91 31 L74 43 L83 60 Z"
            fill="url(#gold)"
          />

          <path
            d="M37 62 L53 57 L47 72 Z"
            fill="#f5c451"
          />

          <path
            d="M83 62 L67 57 L73 72 Z"
            fill="#f5c451"
          />

          <path
            d="M47 79 L60 86 L73 79 L67 94 L60 98 L53 94 Z"
            fill="url(#gold)"
          />

          <path
            d="M52 74 L60 68 L68 74 L60 82 Z"
            fill="#d6a33d"
          />
        </svg>
      </div>

      <div>
        <div className="text-3xl font-black tracking-[0.18em] text-[#d9aa4a]">
          HASWOLF
        </div>

        <div className="text-[10px] tracking-[0.34em] text-zinc-500">
          MARKET
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [market, setMarket] = useState<MarketType>("item");
  const [selectedServer, setSelectedServer] = useState("EPHESUS");
  const [selectedCategory, setSelectedCategory] = useState("Tüm Ürünler");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("recommended");

  const displayedItemProducts = useMemo(() => {
    const filtered = itemProducts.filter((product) =>
      selectedCategory === "Tüm Ürünler"
        ? true
        : product.category === selectedCategory
    );

    const products = [...filtered];
    if (sortOption === "price-asc") {
      return products.sort((a, b) => priceToNumber(a.price) - priceToNumber(b.price));
    }
    if (sortOption === "price-desc") {
      return products.sort((a, b) => priceToNumber(b.price) - priceToNumber(a.price));
    }
    if (sortOption === "newest") {
      return products.reverse();
    }
    return products;
  }, [selectedCategory, sortOption]);

  const displayedYangPackages = useMemo(() => {
    const packages = [...yangPackages];
    if (sortOption === "price-asc") {
      return packages.sort((a, b) => priceToNumber(a.price) - priceToNumber(b.price));
    }
    if (sortOption === "price-desc") {
      return packages.sort((a, b) => priceToNumber(b.price) - priceToNumber(a.price));
    }
    if (sortOption === "newest") {
      return packages.reverse();
    }
    return packages;
  }, [sortOption]);

  const displayedAccounts = useMemo(() => {
    const list = [...accounts];
    if (sortOption === "price-asc") {
      return list.sort((a, b) => priceToNumber(a.price) - priceToNumber(b.price));
    }
    if (sortOption === "price-desc") {
      return list.sort((a, b) => priceToNumber(b.price) - priceToNumber(a.price));
    }
    if (sortOption === "newest") {
      return list.reverse();
    }
    return list;
  }, [sortOption]);

  function goToMarket(type: MarketType) {
    setMarket(type);
    setMobileMenuOpen(false);
    window.setTimeout(() => {
      document.getElementById("market")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }

  function openWhatsApp(message: string) {
    const url = `https://wa.me/905010942080?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main id="top" className="min-h-screen bg-[#050707] text-white">
      <header className="sticky top-0 z-50 border-b border-[#8c641e]/40 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
          <div className="origin-left scale-75 sm:scale-100">
            <WolfLogo />
          </div>

          <nav className="hidden items-center gap-8 text-sm text-zinc-300 lg:flex">
            <a href="#top" className="hover:text-[#d9aa4a]">Ana Sayfa</a>
            <button onClick={() => goToMarket("item")} className="hover:text-[#d9aa4a]">Item Market</button>
            <button onClick={() => goToMarket("yang")} className="hover:text-[#d9aa4a]">Yang Market</button>
            <button onClick={() => goToMarket("account")} className="hover:text-[#d9aa4a]">Hesap Market</button>
            <a href="#footer" className="hover:text-[#d9aa4a]">İletişim</a>
            <a href="/admin" className="hover:text-[#d9aa4a]">Admin</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <AuthButton />
            <button
              onClick={() => openWhatsApp("Merhaba Haswolf, destek almak istiyorum.")}
              className="rounded-lg border border-[#b8862c] px-4 py-3 text-sm font-semibold text-[#e8bd67] transition hover:bg-[#d7a947] hover:text-black"
            >
              7/24 Destek
            </button>
          </div>

          <button
            type="button"
            aria-label="Menüyü aç"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="rounded-lg border border-[#b8862c] px-3 py-2 text-2xl text-[#e8bd67] lg:hidden"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#8c641e]/30 bg-black px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3 text-sm text-zinc-200">
              <a href="#top" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-white/5 px-4 py-3">Ana Sayfa</a>
              <button onClick={() => goToMarket("item")} className="rounded-lg bg-white/5 px-4 py-3 text-left">Item Market</button>
              <button onClick={() => goToMarket("yang")} className="rounded-lg bg-white/5 px-4 py-3 text-left">Yang Market</button>
              <button onClick={() => goToMarket("account")} className="rounded-lg bg-white/5 px-4 py-3 text-left">Hesap Market</button>
              <a href="#footer" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-white/5 px-4 py-3">İletişim</a>
              <a href="/admin" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-white/5 px-4 py-3">Admin Paneli</a>
              <div className="rounded-lg bg-white/5 px-4 py-3"><AuthButton /></div>
              <button onClick={() => openWhatsApp("Merhaba Haswolf, destek almak istiyorum.")} className="rounded-lg border border-green-500/50 bg-green-900/40 px-4 py-3 text-left text-green-300">WhatsApp Destek</button>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden border-b border-[#8c641e]/35">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(190,120,25,0.22),transparent_35%),linear-gradient(110deg,#050707_20%,#10100d_55%,#070707)]" />

        <div className="relative mx-auto grid min-h-[500px] max-w-[1500px] items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.32em] text-[#d5a23e]">
              GÜVENİLİR • HIZLI • PROFESYONEL
            </p>

            <h1 className="mt-5 text-6xl font-black tracking-wide text-[#d9aa4a] md:text-8xl">
              HASWOLF
            </h1>

            <h2 className="mt-3 text-xl tracking-[0.28em] text-zinc-300">
              MARKET
            </h2>

            <p className="mt-8 max-w-xl text-lg leading-8 text-zinc-400">
              Item, Yang ve karakter alışverişinde güvenli, hızlı ve seçkin
              pazar deneyimi.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <button
                onClick={() => goToMarket("item")}
                className="rounded-lg bg-gradient-to-b from-[#e6ba58] to-[#a97521] px-7 py-4 font-bold text-black"
              >
                Markete Git
              </button>

              <a href="#nasil-alisveris" className="rounded-lg border border-[#88652b] px-7 py-4 font-semibold text-[#e0bb70]">
                Nasıl Alışveriş Yapılır?
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative flex h-80 w-80 items-center justify-center rounded-full border border-[#b18131]/30 bg-[radial-gradient(circle,#33220c,#090909_65%)] shadow-2xl shadow-amber-600/10">
              <svg viewBox="0 0 120 120" className="h-56 w-56">
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

      <section className="mx-auto max-w-[1500px] px-6 py-8">
        <div className="rounded-xl border border-[#8c641e]/40 bg-[#0d0f0f]/95 p-6">
          <h2 className="mb-6 text-center text-xl font-bold text-[#ddb45b]">
            ─── SUNUCU SEÇİNİZ ───
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {servers.map((server) => {
              const active = selectedServer === server.name;

              return (
                <button
                  key={server.name}
                  onClick={() => setSelectedServer(server.name)}
                  className={`rounded-xl border bg-black/70 p-6 text-left transition hover:-translate-y-1 ${
                    active ? "scale-[1.02]" : ""
                  }`}
                  style={{
                    borderColor: server.color,
                    boxShadow: active
                      ? `0 0 35px ${server.color}44`
                      : "none",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full border text-3xl"
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
                        className="text-2xl font-black"
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

      <section id="market" className="mx-auto max-w-[1500px] px-4 pb-6 sm:px-6">
        <div className="grid gap-3 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-3 md:grid-cols-3">
          <button
            onClick={() => goToMarket("item")}
            className={`rounded-lg px-5 py-4 font-bold transition ${
              market === "item"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            ⚔ ITEM MARKET
          </button>

          <button
            onClick={() => goToMarket("yang")}
            className={`rounded-lg px-5 py-4 font-bold transition ${
              market === "yang"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            🪙 YANG MARKET
          </button>

          <button
            onClick={() => goToMarket("account")}
            className={`rounded-lg px-5 py-4 font-bold transition ${
              market === "account"
                ? "bg-gradient-to-r from-[#765016] to-[#c29335] text-black"
                : "bg-[#141616] text-zinc-400"
            }`}
          >
            👤 HESAP / KARAKTER
          </button>
        </div>
      </section>

      {market === "item" && (
        <section className="mx-auto grid max-w-[1500px] gap-6 px-6 pb-12 lg:grid-cols-[270px_1fr]">
          <aside>
            <div className="rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-3">
              <h2 className="border-b border-[#765625]/40 px-4 py-5 font-bold text-[#ddb45b]">
                ✣ KATEGORİLER
              </h2>

              <div className="mt-3 space-y-2">
                {categories.map(([icon, name]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedCategory(name)}
                    aria-pressed={selectedCategory === name}
                    className={`flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left text-sm transition ${
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

            <SecurityBox />
          </aside>

          <div className="rounded-xl border border-[#765625]/50 bg-[#090b0b] p-5">
            <MarketTitle
              server={selectedServer}
              title={selectedCategory === "Tüm Ürünler" ? "TÜM ÜRÜNLER" : selectedCategory.toUpperCase()}
              color="#55d35a"
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {displayedItemProducts.map((product) => (
                <article
                  key={product.name}
                  className="overflow-hidden rounded-xl border border-[#765625]/50 bg-gradient-to-b from-[#101313] to-[#070909] transition hover:-translate-y-1 hover:border-[#d0a14b]"
                >
                  <div className="p-4">
                    <h3
                      className="text-center font-bold"
                      style={{ color: product.rarityColor }}
                    >
                      {product.name}
                    </h3>

                    <div className="flex h-44 items-center justify-center text-8xl">
                      {product.icon}
                    </div>

                    <div
                      className="text-center text-lg tracking-widest"
                      style={{ color: product.rarityColor }}
                    >
                      {product.stars}
                    </div>

                    <div
                      className="mt-2 border-b border-white/10 pb-3 text-center text-sm font-bold"
                      style={{ color: product.rarityColor }}
                    >
                      {product.rarity}
                    </div>

                    <ul className="mt-4 min-h-32 space-y-2 text-xs leading-5 text-zinc-400">
                      {product.stats.map((stat) => (
                        <li key={stat}>◆ {stat}</li>
                      ))}
                    </ul>

                    <div className="mt-4 text-center text-xl font-black text-[#e7b74f]">
                      ◉ {product.price}
                    </div>

                    <WhatsAppButton message={`Merhaba Haswolf, ${selectedServer} sunucusundaki ${product.name} ürünü hakkında bilgi almak istiyorum.`} />
                  </div>
                </article>
              ))}

              {displayedItemProducts.length === 0 && (
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
        <section className="mx-auto max-w-[1500px] px-6 pb-12">
          <div className="rounded-xl border border-[#765625]/50 bg-[#090b0b] p-6">
            <MarketTitle
              server={selectedServer}
              title="YANG MARKET"
              color="#e5b64e"
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayedYangPackages.map((pack) => (
                <article
                  key={pack.amount}
                  className="rounded-xl border border-[#8b672d]/60 bg-gradient-to-b from-[#15130d] to-[#080909] p-7 text-center transition hover:-translate-y-1 hover:border-[#e2b64e]"
                >
                  <div className="text-6xl">🪙</div>

                  <h3 className="mt-5 text-3xl font-black text-[#e5b64e]">
                    {pack.amount}
                  </h3>

                  <p className="mt-3 text-sm text-emerald-400">
                    {pack.bonus}
                  </p>

                  <div className="mt-7 text-2xl font-black">{pack.price}</div>

                  <p className="mt-3 text-sm text-zinc-500">
                    Sunucu: {selectedServer}
                  </p>

                  <WhatsAppButton message={`Merhaba Haswolf, ${selectedServer} sunucusu için ${pack.amount} paketini satın almak istiyorum.`} />
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {market === "account" && (
        <section className="mx-auto max-w-[1500px] px-6 pb-12">
          <div className="rounded-xl border border-[#765625]/50 bg-[#090b0b] p-6">
            <MarketTitle
              server={selectedServer}
              title="HESAP / KARAKTER MARKET"
              color="#b660ff"
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {displayedAccounts.map((account) => (
                <article
                  key={account.className}
                  className="rounded-xl border border-[#765625]/50 bg-gradient-to-b from-[#131017] to-[#070909] p-6 transition hover:-translate-y-1 hover:border-purple-400"
                >
                  <div className="flex h-40 items-center justify-center text-8xl">
                    {account.icon}
                  </div>

                  <h3 className="text-center text-2xl font-black text-purple-400">
                    {account.className}
                  </h3>

                  <p className="mt-2 text-center font-semibold">
                    {account.level}
                  </p>

                  <p className="mt-1 text-center text-sm text-zinc-500">
                    {account.type}
                  </p>

                  <ul className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm text-zinc-400">
                    {account.details.map((detail) => (
                      <li key={detail}>◆ {detail}</li>
                    ))}
                  </ul>

                  <div className="mt-6 text-center text-2xl font-black text-[#e5b64e]">
                    {account.price}
                  </div>

                  <WhatsAppButton message={`Merhaba Haswolf, ${selectedServer} sunucusundaki ${account.className} ${account.level} hesabı hakkında bilgi almak istiyorum.`} />
                </article>
              ))}
            </div>
          </div>
        </section>
      )}


      <section id="nasil-alisveris" className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-6">
        <div className="rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-6 sm:p-8">
          <h2 className="text-center text-2xl font-black text-[#ddb45b]">Nasıl Alışveriş Yapılır?</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["1", "Ürünü seç", "Sunucu ve market türünü seçip almak istediğin ürünü belirle."],
              ["2", "WhatsApp'tan yaz", "Ürün kartındaki WhatsApp düğmesine dokun; hazır mesaj doğrudan açılır."],
              ["3", "Güvenli teslimat", "Ödeme ve teslimat bilgileri doğrulandıktan sonra işlem tamamlanır."],
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-xl border border-[#765625]/40 bg-black/30 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d9aa4a] text-lg font-black text-black">{number}</div>
                <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 pb-12">
        <div className="grid gap-5 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-7 md:grid-cols-4">
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

      <footer
        id="footer"
        className="border-t border-[#765625]/40 bg-black"
      >
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
          <WolfLogo />

          <p className="text-sm text-zinc-600">
            © 2026 HASWOLF MARKET — Tüm hakları saklıdır.
          </p>

          <div className="flex gap-5 text-xl">
            <span>☎</span>
            <span>◎</span>
            <span>◉</span>
          </div>
        </div>
      </footer>
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
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#765625]/40 pb-5 md:flex-row md:items-center">
      <div>
        <span className="text-xl font-bold" style={{ color }}>
          {server}
        </span>
        <span className="mx-3 text-zinc-600">›</span>
        <span className="text-lg font-semibold">{title}</span>
      </div>

      <select
        value={sortOption}
        onChange={(event) => onSortChange(event.target.value as SortOption)}
        className="rounded-lg border border-[#765625]/50 bg-[#151717] px-4 py-3 text-sm text-zinc-300"
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
      className="mt-5 block w-full rounded-lg border border-green-400/50 bg-gradient-to-b from-green-700 to-green-900 px-3 py-3 text-center text-sm font-semibold text-white transition hover:brightness-125"
    >
      ☎ WhatsApp ile Satın Al
    </a>
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