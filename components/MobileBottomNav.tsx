"use client";

type MarketType = "item" | "yang" | "account";

function YangIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.2rem] w-[1.2rem]" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#d9aa4a" stroke="#f4d27a" strokeWidth="1.5" />
      <path d="M8 7.5 12 10l4-2.5-1.2 4.2 2.2 3.1-4.2-.1L12 18l-.8-3.3-4.2.1 2.2-3.1Z" fill="#5b3908" stroke="#fff0b0" strokeWidth=".65" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.25" fill="#f8de8c" />
    </svg>
  );
}

export default function MobileBottomNav({
  activeMarket,
  onMarketChange,
}: {
  activeMarket: MarketType;
  onMarketChange: (market: MarketType) => void;
}) {
  return (
    <nav className="haswolf-bottom-nav lg:hidden" aria-label="Mobil alt navigasyon">
      <a href="#top">
        <span className="haswolf-bottom-nav__icon">⌂</span>
        <span>Ana Sayfa</span>
      </a>

      <button
        type="button"
        className={activeMarket === "item" ? "is-active" : ""}
        onClick={() => onMarketChange("item")}
      >
        <span className="haswolf-bottom-nav__icon">⚔</span>
        <span>Item</span>
      </button>

      <a href="/topluluk">
        <span className="haswolf-bottom-nav__icon">◉</span>
        <span>Sohbet</span>
      </a>

      <button
        type="button"
        className={activeMarket === "yang" ? "is-active" : ""}
        onClick={() => onMarketChange("yang")}
      >
        <YangIcon />
        <span>Yang</span>
      </button>
    </nav>
  );
}
