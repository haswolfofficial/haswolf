param(
  [string]$ProjectPath = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectPath

function Backup-File([string]$Path) {
  if (!(Test-Path $Path)) { throw "Dosya bulunamadı: $Path" }
  $backupRoot = Join-Path $ProjectPath ".haswolf-backup-sprint1"
  $target = Join-Path $backupRoot $Path
  New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
  Copy-Item $Path $target -Force
}

function Write-Utf8([string]$Path, [string]$Content) {
  $dir = Split-Path $Path
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText((Join-Path $ProjectPath $Path), $Content, [System.Text.UTF8Encoding]::new($false))
}

function Replace-Required([string]$Text, [string]$Pattern, [string]$Replacement, [string]$Label) {
  $rx = [regex]::new($Pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if (!$rx.IsMatch($Text)) { throw "Beklenen kod bulunamadı: $Label" }
  return $rx.Replace($Text, $Replacement, 1)
}

$files = @(
  "app/page.tsx",
  "app/globals.css",
  "components/LanguageSelector.tsx",
  "components/AutoTranslate.tsx",
  "components/NotificationCenter.tsx"
)
$files | ForEach-Object { Backup-File $_ }

$languageSelector = @'
"use client";

import { useEffect, useRef, useState } from "react";

const languages = [
  { code: "tr", label: "Türkçe", short: "TR", flag: "🇹🇷" },
  { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", short: "DE", flag: "🇩🇪" },
  { code: "fr", label: "Français", short: "FR", flag: "🇫🇷" },
  { code: "es", label: "Español", short: "ES", flag: "🇪🇸" },
  { code: "pt", label: "Português", short: "PT", flag: "🇵🇹" },
  { code: "ru", label: "Русский", short: "RU", flag: "🇷🇺" },
  { code: "ar", label: "العربية", short: "AR", flag: "🇸🇦" },
  { code: "it", label: "Italiano", short: "IT", flag: "🇮🇹" },
  { code: "pl", label: "Polski", short: "PL", flag: "🇵🇱" },
] as const;

type LanguageCode = (typeof languages)[number]["code"];
const STORAGE_KEY = "haswolf_language";

function clearTranslateCookies() {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=;expires=${expires};path=/`;
  document.cookie = `googtrans=;expires=${expires};path=/;domain=${location.hostname}`;
  const rootDomain = location.hostname.split(".").slice(-2).join(".");
  if (rootDomain.includes(".")) {
    document.cookie = `googtrans=;expires=${expires};path=/;domain=.${rootDomain}`;
  }
}

export default function LanguageSelector() {
  const [value, setValue] = useState<LanguageCode>("tr");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const detected = (saved || navigator.languages?.[0] || navigator.language || "tr")
      .split("-")[0] as LanguageCode;
    setValue(languages.some((item) => item.code === detected) ? detected : "tr");

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function changeLanguage(language: LanguageCode) {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    clearTranslateCookies();
    if (language !== "tr") {
      const cookie = `/tr/${language}`;
      document.cookie = `googtrans=${cookie};path=/;SameSite=Lax`;
      document.cookie = `googtrans=${cookie};path=/;domain=${location.hostname};SameSite=Lax`;
    }

    setValue(language);
    setOpen(false);
    location.reload();
  }

  const active = languages.find((item) => item.code === value) ?? languages[0];

  return (
    <div ref={rootRef} className="haswolf-language-menu">
      <button
        type="button"
        className="haswolf-language-menu__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{active.flag}</span>
        <strong>{active.short}</strong>
        <span aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="haswolf-language-menu__panel" role="listbox" aria-label="Site dili">
          <header>
            <strong>Dil Seçimi</strong>
            <small>Seçimin tüm sayfalarda korunur</small>
          </header>
          <div>
            {languages.map((language) => (
              <button
                type="button"
                role="option"
                aria-selected={language.code === value}
                className={language.code === value ? "is-active" : ""}
                key={language.code}
                onClick={() => changeLanguage(language.code)}
              >
                <span>{language.flag}</span>
                <span>{language.label}</span>
                <b>{language.short}</b>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
'@

$autoTranslate = @'
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          elementId: string,
        ) => void;
      };
    };
  }
}

const supported = new Set(["tr", "en", "de", "fr", "es", "pt", "ru", "ar", "it", "pl"]);

export default function AutoTranslate() {
  useEffect(() => {
    const saved = localStorage.getItem("haswolf_language");
    const detected = (saved || navigator.languages?.[0] || navigator.language || "tr").split("-")[0];
    const language = supported.has(detected) ? detected : "tr";

    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    if (!saved) localStorage.setItem("haswolf_language", language);
    if (language === "tr") return;

    const cookie = `/tr/${language}`;
    document.cookie = `googtrans=${cookie};path=/;SameSite=Lax`;
    document.cookie = `googtrans=${cookie};path=/;domain=${location.hostname};SameSite=Lax`;

    window.googleTranslateElementInit = () => {
      if (window.google) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "tr", autoDisplay: false },
          "google_translate_element",
        );
      }
    };

    if (!document.getElementById("haswolf-google-translate")) {
      const script = document.createElement("script");
      script.id = "haswolf-google-translate";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return <div id="google_translate_element" className="sr-only" aria-hidden="true" />;
}
'@

$notificationCenter = @'
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Deal = {
  id: number;
  name: string;
  price: number;
  old_price: number | null;
  server: string;
  category: "item" | "yang" | "dc" | "account";
};

const STORAGE_KEY = "haswolf_seen_discount_ids_v2";

export default function NotificationCenter({ deals }: { deals: Deal[] }) {
  const eligible = useMemo(
    () => deals.filter((deal) => deal.old_price && deal.old_price > deal.price),
    [deals],
  );
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(parsed)) setSeenIds(parsed.filter(Number.isFinite));
    } catch {}
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!eligible.length) return;
    const unseenIndex = eligible.findIndex((deal) => !seenIds.includes(deal.id));
    if (unseenIndex < 0) return;
    setActiveIndex(unseenIndex);
    const showTimer = window.setTimeout(() => setToastVisible(true), 1800);
    const hideTimer = window.setTimeout(() => {
      setToastVisible(false);
      markSeen(eligible[unseenIndex].id);
    }, 9500);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [eligible, seenIds]);

  function markSeen(id: number) {
    setSeenIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function closeToast() {
    const deal = eligible[activeIndex];
    if (deal) markSeen(deal.id);
    setToastVisible(false);
  }

  const unreadCount = eligible.filter((deal) => !seenIds.includes(deal.id)).length;
  const activeDeal = eligible[activeIndex];

  return (
    <>
      <div ref={rootRef} className="haswolf-notification-root">
        <button
          type="button"
          className="haswolf-notification-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="haswolf-notification-panel"
        >
          <span aria-hidden="true">🔔</span>
          <span>Bildirimler</span>
          {unreadCount > 0 && <b>{unreadCount > 9 ? "9+" : unreadCount}</b>}
        </button>

        {open && (
          <aside id="haswolf-notification-panel" className="haswolf-notification-panel">
            <header>
              <div>
                <small>HASWOLF</small>
                <h2>Bildirim Merkezi</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Kapat">×</button>
            </header>

            <div className="haswolf-notification-list">
              {eligible.length ? (
                eligible.map((deal) => {
                  const unit = deal.category === "dc" ? "M" : "TL";
                  const pct = Math.round(((deal.old_price! - deal.price) / deal.old_price!) * 100);
                  const unread = !seenIds.includes(deal.id);
                  return (
                    <button
                      key={deal.id}
                      type="button"
                      className={unread ? "is-unread" : ""}
                      onClick={() => markSeen(deal.id)}
                    >
                      <span>🔥</span>
                      <span>
                        <strong>{deal.name}</strong>
                        <small>{deal.server} · %{pct} indirim</small>
                        <span>
                          <del>{deal.old_price!.toLocaleString("tr-TR")} {unit}</del>
                          <b>{deal.price.toLocaleString("tr-TR")} {unit}</b>
                        </span>
                      </span>
                      {unread && <i />}
                    </button>
                  );
                })
              ) : (
                <div className="haswolf-notification-empty">Yeni bildirim bulunmuyor.</div>
              )}
            </div>
          </aside>
        )}
      </div>

      {activeDeal && (
        <aside className={`haswolf-sale-toast ${toastVisible ? "is-visible" : ""}`} aria-live="polite">
          <button onClick={closeToast} aria-label="Bildirimi kapat">×</button>
          <span className="haswolf-sale-toast__eyebrow">YENİ İNDİRİM 🔥</span>
          <strong>{activeDeal.name}</strong>
          <small>{activeDeal.server}</small>
          <div>
            <del>{activeDeal.old_price!.toLocaleString("tr-TR")} {activeDeal.category === "dc" ? "M" : "TL"}</del>
            <b>{activeDeal.price.toLocaleString("tr-TR")} {activeDeal.category === "dc" ? "M" : "TL"}</b>
          </div>
          <p>Kapatınca Bildirimler alanında kalır.</p>
        </aside>
      )}
    </>
  );
}
'@

Write-Utf8 "components/LanguageSelector.tsx" $languageSelector
Write-Utf8 "components/AutoTranslate.tsx" $autoTranslate
Write-Utf8 "components/NotificationCenter.tsx" $notificationCenter

$pagePath = Join-Path $ProjectPath "app/page.tsx"
$page = [System.IO.File]::ReadAllText($pagePath)

# Header: logo ile sosyal alan arasına kompakt al/sat CTA.
$page = Replace-Required $page `
  '(<WolfLogo\s*/>\s*)(\r?\n\s*<div className="haswolf-topbar__actions">)' `
  @'
$1
            <div className="haswolf-header-trade">
              <button type="button" onClick={() => goToMarket("item")} className="haswolf-header-trade__buy">
                <span aria-hidden="true">🛒</span><span><strong>Bizden Satın Al</strong><small>Market ürünlerini incele</small></span>
              </button>
              <button type="button" onClick={() => openWhatsApp("Merhaba Haswolf, Item, Yang veya DC satmak istiyorum. Teklif almak istiyorum.")} className="haswolf-header-trade__sell">
                <span aria-hidden="true">💰</span><span><strong>Bize Sat</strong><small>Hızlı teklif al</small></span>
              </button>
            </div>
$2
'@ 'Header al/sat alanı'

# Hero içindeki büyük iki kartı kaldır, hero kompakt kalsın.
$page = Replace-Required $page `
  '<div className="haswolf-trade-actions">.*?<a href="/cekilis" className="haswolf-secondary-cta haswolf-trade-actions__raffle">.*?</a>\s*</div>' `
  @'
<div className="haswolf-hero-quick-links">
                  <button type="button" onClick={() => goToMarket("item")}>Markete Git</button>
                  <a href="/cekilis">★ Çekiliş Merkezi</a>
                </div>
'@ 'Hero büyük al/sat kartları'

# Sunucu kartı: tek buton yerine iki buton.
$page = Replace-Required $page `
  '<button\s+type="button"\s+onClick=\{\(\) => openWhatsApp\(`Merhaba Haswolf, \$\{server\.name\} sunucusunda Yang veya oyun içi varlık satmak istiyorum\.`\)\}\s+className="haswolf-sell-button mt-4 w-full rounded-lg px-4 py-2\.5 text-sm font-black"\s*>\s*BİZE SAT\s*</button>' `
  @'
<div className="haswolf-server-actions mt-4">
                    <button type="button" onClick={() => { setSelectedServer(server.name); goToMarket("yang"); }} className="haswolf-buy-button">
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
'@ 'Sunucu çift butonu'

# Yang kartındaki belirsiz WhatsApp metnini profesyonelleştir.
$page = $page.Replace(">WhatsApp<", ">WhatsApp ile Satın Al<")
$page = $page.Replace("WhatsApp`r`n", "WhatsApp ile Satın Al`r`n")

Write-Utf8 "app/page.tsx" $page

$cssPath = Join-Path $ProjectPath "app/globals.css"
$css = [System.IO.File]::ReadAllText($cssPath)
$marker = "/* HASWOLF V4 SPRINT 1 PREMIUM OVERRIDES */"
if (!$css.Contains($marker)) {
$css += @'

/* HASWOLF V4 SPRINT 1 PREMIUM OVERRIDES */
.haswolf-topbar { gap: 1rem; }
.haswolf-header-trade {
  display: none;
  align-items: stretch;
  gap: .55rem;
  margin-inline: auto;
}
.haswolf-header-trade button {
  display: flex;
  align-items: center;
  gap: .65rem;
  min-width: 10.75rem;
  min-height: 3.35rem;
  padding: .65rem .85rem;
  border-radius: .9rem;
  border: 1px solid rgba(217,170,74,.34);
  background: linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.025));
  color: #f2f2f2;
  text-align: left;
  box-shadow: 0 10px 30px rgba(0,0,0,.22);
  transition: transform .2s ease,border-color .2s ease,box-shadow .2s ease;
}
.haswolf-header-trade button:hover {
  transform: translateY(-2px);
  border-color: rgba(239,198,104,.75);
  box-shadow: 0 14px 38px rgba(0,0,0,.38),0 0 24px rgba(217,170,74,.08);
}
.haswolf-header-trade button > span:first-child { font-size: 1.3rem; }
.haswolf-header-trade strong,.haswolf-header-trade small { display:block; }
.haswolf-header-trade strong { font-size: .76rem; color:#efc668; }
.haswolf-header-trade small { margin-top:.12rem;font-size:.62rem;color:#929696; }
.haswolf-header-trade__buy { border-color:rgba(44,190,103,.42)!important;background:linear-gradient(180deg,rgba(14,83,43,.35),rgba(4,25,14,.38))!important; }
.haswolf-header-trade__sell { background:linear-gradient(180deg,rgba(141,91,15,.26),rgba(35,22,5,.5))!important; }

.haswolf-hero-quick-links { display:flex;flex-wrap:wrap;gap:.65rem; }
.haswolf-hero-quick-links button,.haswolf-hero-quick-links a {
  min-height:2.85rem;display:inline-flex;align-items:center;justify-content:center;
  border-radius:.75rem;padding:.65rem 1rem;font-weight:800;font-size:.78rem;
}
.haswolf-hero-quick-links button { background:linear-gradient(135deg,#e6b951,#9b6818);color:#080808; }
.haswolf-hero-quick-links a { border:1px solid rgba(217,170,74,.52);color:#e9bf68;background:rgba(0,0,0,.28); }

.haswolf-server-actions { display:grid;grid-template-columns:1fr 1fr;gap:.55rem; }
.haswolf-server-actions button {
  min-height:2.65rem;border-radius:.7rem;padding:.55rem .65rem;font-size:.7rem;font-weight:950;
  transition:transform .2s ease,filter .2s ease,box-shadow .2s ease;
}
.haswolf-server-actions button:hover { transform:translateY(-2px);filter:brightness(1.08); }
.haswolf-buy-button {
  border:1px solid rgba(48,197,105,.6);color:#d9ffe7;
  background:linear-gradient(135deg,#106b36,#063a1d);
  box-shadow:0 8px 24px rgba(20,155,74,.14);
}

.haswolf-language-menu,.haswolf-notification-root { position:relative; }
.haswolf-language-menu__trigger {
  min-height:3rem;display:flex;align-items:center;justify-content:center;gap:.4rem;
  padding:.55rem .72rem;border:1px solid rgba(217,170,74,.34);border-radius:.8rem;
  background:rgba(255,255,255,.035);color:#f1cf85;font-size:.75rem;
}
.haswolf-language-menu__panel {
  position:absolute;z-index:120;top:calc(100% + .65rem);right:0;width:min(21rem,calc(100vw - 1rem));
  padding:.75rem;border:1px solid rgba(217,170,74,.42);border-radius:1rem;
  background:rgba(7,9,9,.98);box-shadow:0 24px 80px rgba(0,0,0,.72);backdrop-filter:blur(24px);
}
.haswolf-language-menu__panel header { padding:.35rem .35rem .7rem;border-bottom:1px solid rgba(255,255,255,.08); }
.haswolf-language-menu__panel header strong,.haswolf-language-menu__panel header small { display:block; }
.haswolf-language-menu__panel header small { margin-top:.2rem;color:#858989;font-size:.68rem; }
.haswolf-language-menu__panel > div { display:grid;grid-template-columns:1fr 1fr;gap:.35rem;margin-top:.6rem; }
.haswolf-language-menu__panel button {
  display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.5rem;
  padding:.65rem;border-radius:.7rem;color:#d5d7d7;text-align:left;font-size:.73rem;
}
.haswolf-language-menu__panel button:hover,.haswolf-language-menu__panel button.is-active {
  background:rgba(217,170,74,.13);color:#f1c96f;
}
.haswolf-language-menu__panel button b { color:#777;font-size:.62rem; }

.haswolf-notification-panel {
  position:absolute!important;top:calc(100% + .65rem)!important;right:0!important;
  left:auto!important;width:min(23rem,calc(100vw - 1rem))!important;max-height:min(30rem,72vh)!important;
  border-radius:1rem!important;overflow:hidden!important;
}
.haswolf-notification-panel header { padding:.85rem 1rem!important; }
.haswolf-notification-panel header h2 { font-size:.95rem!important; }
.haswolf-notification-list { max-height:23rem!important;overflow:auto!important;padding:.5rem!important; }
.haswolf-notification-list > button { min-height:auto!important;padding:.7rem!important;border-radius:.75rem!important; }
.haswolf-sale-toast { max-width:min(20rem,calc(100vw - 1rem))!important; }

@media (min-width:1180px) { .haswolf-header-trade { display:flex; } }
@media (max-width:640px) {
  .haswolf-server-actions { grid-template-columns:1fr; }
  .haswolf-language-menu__panel > div { grid-template-columns:1fr; }
}
'@
Write-Utf8 "app/globals.css" $css
}

Write-Host ""
Write-Host "HASWOLF v4 Sprint 1 başarıyla uygulandı." -ForegroundColor Green
Write-Host "Yedekler: .haswolf-backup-sprint1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Şimdi çalıştır:" -ForegroundColor Cyan
Write-Host "npm run dev"
Write-Host ""
Write-Host "Kontrol sonrası GitHub'a gönder:" -ForegroundColor Cyan
Write-Host 'git add .'
Write-Host 'git commit -m "HASWOLF v4 Sprint 1 premium header language notifications"'
Write-Host 'git push'
