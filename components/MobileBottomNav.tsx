"use client";

type MarketType = "item" | "yang" | "account";

export default function MobileBottomNav({
  activeMarket,
  onMarketChange,
}: {
  activeMarket: MarketType;
  onMarketChange: (market: MarketType) => void;
}) {
  const items = [
    { key: "home", label: "Ana Sayfa", icon: "⌂", href: "#top" },
    { key: "item", label: "Market", icon: "⚔" },
    { key: "community", label: "Sohbet", icon: "◉", href: "/topluluk" },
    { key: "account", label: "Hesap", icon: "♛" },
    { key: "support", label: "Destek", icon: "✦", href: "#footer" },
  ] as const;

  return (
    <nav className="haswolf-bottom-nav lg:hidden" aria-label="Mobil alt navigasyon">
      {items.map((item) => {
        const active = item.key === activeMarket;
        const content = (
          <>
            <span className="haswolf-bottom-nav__icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </>
        );

        if (item.key === "item" || item.key === "account") {
          return (
            <button
              key={item.key}
              type="button"
              aria-current={active ? "page" : undefined}
              className={active ? "is-active" : ""}
              onClick={() => onMarketChange(item.key)}
            >
              {content}
            </button>
          );
        }

        return (
          <a key={item.key} href={item.href}>
            {content}
          </a>
        );
      })}
    </nav>
  );
}
