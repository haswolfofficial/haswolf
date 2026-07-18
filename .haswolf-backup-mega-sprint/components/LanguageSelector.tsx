"use client";

import { useEffect, useRef, useState } from "react";

const languages = [
  { code: "tr", label: "TÃ¼rkÃ§e", short: "TR", flag: "ğŸ‡¹ğŸ‡·" },
  { code: "en", label: "English", short: "EN", flag: "ğŸ‡¬ğŸ‡§" },
  { code: "de", label: "Deutsch", short: "DE", flag: "ğŸ‡©ğŸ‡ª" },
  { code: "fr", label: "FranÃ§ais", short: "FR", flag: "ğŸ‡«ğŸ‡·" },
  { code: "es", label: "EspaÃ±ol", short: "ES", flag: "ğŸ‡ªğŸ‡¸" },
  { code: "pt", label: "PortuguÃªs", short: "PT", flag: "ğŸ‡µğŸ‡¹" },
  { code: "ru", label: "Ğ ÑƒÑÑĞºĞ¸Ğ¹", short: "RU", flag: "ğŸ‡·ğŸ‡º" },
  { code: "ar", label: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©", short: "AR", flag: "ğŸ‡¸ğŸ‡¦" },
  { code: "it", label: "Italiano", short: "IT", flag: "ğŸ‡®ğŸ‡¹" },
  { code: "pl", label: "Polski", short: "PL", flag: "ğŸ‡µğŸ‡±" },
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